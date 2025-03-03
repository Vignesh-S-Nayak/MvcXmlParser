using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.Extensions.Caching.Memory;
using MvcXmlParser.Models;

namespace MvcXmlParser.Services
{
    public class XMLParserService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly TimeSpan _cacheDuration = TimeSpan.FromHours(1);

        public XMLParserService(HttpClient httpClient, IMemoryCache memoryCache)
        {
            _httpClient = httpClient;
            _cache = memoryCache;
        }

        public async Task<List<Category>> ParseXmlAsync(string url)
        {
            string cacheKey = $"xml_data_{url}";
            if (_cache.TryGetValue(cacheKey, out List<Category> cachedCategories))
            {
                return cachedCategories;
            }

            var categories = new List<Category>();
            try
            {
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();
                var xmlContent = await response.Content.ReadAsStringAsync();
                var doc = XDocument.Parse(xmlContent);
                XNamespace xs = "http://www.w3.org/2001/XMLSchema";

                var types = doc.Descendants()
                    .Where(e => e.Name == xs + "simpleType" || e.Name == xs + "complexType")
                    .ToList();

                foreach (var type in types)
                {
                    var categoryName = type.Attribute("name")?.Value;
                    if (string.IsNullOrEmpty(categoryName))
                        continue;

                    var categoryDoc = type.Element(xs + "annotation")?
                        .Element(xs + "documentation")?.Value?.Trim() ?? "";
                    var children = new List<ParsedElement>();

                    if (type.Name == xs + "simpleType")
                    {
                        var restriction = type.Element(xs + "restriction");
                        children.AddRange(
                            restriction?.Elements(xs + "enumeration")
                                .Select(enumElement => new ParsedElement
                                {
                                    Value = CleanupContent(enumElement.Attribute("value")?.Value),
                                    Description = CleanupContent(
                                        enumElement.Element(xs + "annotation")?
                                        .Element(xs + "documentation")?.Value)
                                })
                                .Where(pe => !string.IsNullOrEmpty(pe.Value) && !string.IsNullOrEmpty(pe.Description))
                                ?? Enumerable.Empty<ParsedElement>());
                    }
                    else if (type.Name == xs + "complexType")
                    {
                        var sequence = type.Element(xs + "sequence");
                        if (sequence != null)
                        {
                            children.AddRange(
                                sequence.Elements(xs + "element")
                                    .Select(childElement => new ParsedElement
                                    {
                                        Value = CleanupContent(childElement.Attribute("name")?.Value),
                                        Description = CleanupContent(
                                            childElement.Element(xs + "annotation")?
                                            .Element(xs + "documentation")?.Value)
                                    })
                                    .Where(pe => !string.IsNullOrEmpty(pe.Value) && !string.IsNullOrEmpty(pe.Description))
                            );
                        }
                    }

                    if (children.Any())
                    {
                        categories.Add(new Category
                        {
                            Name = categoryName,
                            Description = categoryDoc,
                            Children = children
                        });
                    }
                }

                _cache.Set(cacheKey, categories, _cacheDuration);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing XML: {ex.Message}");
            }
            return categories;
        }

        private string CleanupContent(string content)
        {
            if (string.IsNullOrEmpty(content))
                return string.Empty;
            content = Regex.Replace(content, @"\s+", " ");
            return content.Trim();
        }
    }
}
