import { useState, useEffect, useMemo } from "react";
import { Article, PopulatedCategory, PopulatedSubCategory, PopulatedTag, PopulatedAuthor, MessageType } from "./article";

const API_BASE_URL = 'http://localhost:5050/api';

export const useArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState<MessageType | null>(null);

  // State for edit modal data
  const [categories, setCategories] = useState<PopulatedCategory[]>([]);
  const [subcategories, setSubcategories] = useState<PopulatedSubCategory[]>([]);
  const [tags, setTags] = useState<PopulatedTag[]>([]);
  const [authors, setAuthors] = useState<PopulatedAuthor[]>([]);

  // Fetch articles from backend
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5050/api/articles');
      const result = await response.json();
      
      if (result.success) {
        setArticles(result.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch articles' });
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setMessage({ type: 'error', text: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data for edit form
  const fetchEditData = async () => {
    try {
      const [categoriesResponse, subcategoriesResponse, tagsResponse, authorsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/categories?isActive=true`),
        fetch(`${API_BASE_URL}/sub-categories?isActive=true`),
        fetch(`${API_BASE_URL}/tags?isActive=true`),
        fetch(`${API_BASE_URL}/users`)
      ]);

      const [categoriesData, subcategoriesData, tagsData, authorsData] = await Promise.all([
        categoriesResponse.json(),
        subcategoriesResponse.json(),
        tagsResponse.json(),
        authorsResponse.json()
      ]);

      if (categoriesData.success) setCategories(categoriesData.data);
      if (subcategoriesData.success) setSubcategories(subcategoriesData.data);
      if (tagsData.success) setTags(tagsData.data);
      if (authorsData.success) {
        const activeAuthors = authorsData.data.filter((user: PopulatedAuthor) => 
          user.status === 'active' && 
          ['writer', 'editor', 'admin', 'superadmin'].includes(user.role)
        );
        setAuthors(activeAuthors);
      }
    } catch (error) {
      console.error('Error fetching edit data:', error);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchEditData();
  }, []);

  // Get unique categories for filter
  const availableCategories = useMemo(() => 
    Array.from(new Set(articles.map(article => article.category?._id)))
      .map(id => articles.find(article => article.category?._id === id)?.category)
      .filter((cat): cat is PopulatedCategory => cat !== undefined),
    [articles]
  );

  // Helper function to get author display name
  const getAuthorName = (author: PopulatedAuthor) => {
    return `${author.firstName} ${author.lastName}`;
  };

  // Filter articles based on search and filters
  const filteredArticles = useMemo(() => 
    articles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.authors.some(author => 
          getAuthorName(author).toLowerCase().includes(searchTerm.toLowerCase()) ||
          author.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "published" && article.status === "published") ||
                           (statusFilter === "draft" && article.status === "draft");
      
      const matchesCategory = categoryFilter === "all" || article.category?._id === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    }),
    [articles, searchTerm, statusFilter, categoryFilter]
  );

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return {
    articles,
    filteredArticles,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    message,
    setMessage,
    availableCategories,
    categories,
    subcategories,
    tags,
    authors,
    fetchArticles,
    getAuthorName
  };
};