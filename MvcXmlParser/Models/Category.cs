namespace MvcXmlParser.Models
{
    public class Category
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public List<ParsedElement> Children { get; set; }
    }
}