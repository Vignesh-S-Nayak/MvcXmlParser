using Microsoft.AspNetCore.Mvc;
using MvcXmlParser.Models;
using MvcXmlParser.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MvcXmlParser.Controllers
{
    public class HomeController : Controller
    {
        private readonly XMLParserService _xmlParserService;

        public HomeController(XMLParserService xmlParserService)
        {
            _xmlParserService = xmlParserService;
        }

        public async Task<IActionResult> Index(string version = "6.0.0", string searchTerm = "", string sortBy = "Name",
            string sortOrder = "asc", int page = 1, int pageSize = 10)
        {
            string url = $"https://receiptservice.egretail.cloud/ARTSPOSLogSchema/{version}";
            var allCategories = await _xmlParserService.ParseXmlAsync(url);
            var categories = new List<Category>(allCategories);

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                var filteredCategories = new List<Category>();

                foreach (var category in categories)
                {
                    bool categoryMatches = category.Name.ToLower().Contains(searchTerm) ||
                                           (category.Description != null && category.Description.ToLower().Contains(searchTerm));
                    var matchingChildren = category.Children
                        .Where(child => (child.Value != null && child.Value.ToLower().Contains(searchTerm)) ||
                                        (child.Description != null && child.Description.ToLower().Contains(searchTerm)))
                        .ToList();

                    if (matchingChildren.Any() || categoryMatches)
                    {
                        var filteredCategory = new Category
                        {
                            Name = category.Name,
                            Description = category.Description,
                            Children = categoryMatches ? new List<ParsedElement>(category.Children) : matchingChildren
                        };
                        filteredCategories.Add(filteredCategory);
                    }
                }
                categories = filteredCategories;
            }

            
            categories = SortCategories(categories, sortBy, sortOrder);

            
            var totalItems = categories.Count;
            var totalPages = (int)Math.Ceiling((double)totalItems / pageSize);
            categories = categories.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            ViewBag.SelectedVersion = version;
            ViewBag.SearchTerm = searchTerm;
            ViewBag.SortBy = sortBy;
            ViewBag.SortOrder = sortOrder;
            ViewBag.CurrentPage = page;
            ViewBag.PageSize = pageSize;
            ViewBag.TotalPages = totalPages;
            ViewBag.TotalItems = totalItems;

            return View(categories);
        }

        private List<Category> SortCategories(List<Category> categories, string sortBy, string sortOrder)
        {
            switch (sortBy)
            {
                case "Name":
                    return sortOrder == "asc"
                        ? categories.OrderBy(c => c.Name).ToList()
                        : categories.OrderByDescending(c => c.Name).ToList();
                case "ChildCount":
                    return sortOrder == "asc"
                        ? categories.OrderBy(c => c.Children.Count).ToList()
                        : categories.OrderByDescending(c => c.Children.Count).ToList();
                default:
                    return categories.OrderBy(c => c.Name).ToList();
            }
        }
    }
}
