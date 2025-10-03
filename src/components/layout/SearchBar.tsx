import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Challenge {
  id: string;
  title: string;
}

export const SearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Challenge[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Normalize text for search (remove accents and convert to lowercase)
  const normalizeText = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('id, title')
        .eq('is_active', true)
        .limit(10);

      if (error) {
        console.error('Error fetching challenges:', error);
        return;
      }

      if (data) {
        const normalizedQuery = normalizeText(query);
        const filteredChallenges = data.filter(challenge =>
          normalizeText(challenge.title).includes(normalizedQuery)
        );
        setSuggestions(filteredChallenges);
      }
    } catch (error) {
      console.error('Error searching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (challengeId: string) => {
    navigate(`/challenges`);
    setSearchQuery('');
    setSuggestions([]);
    setIsOpen(false);
    // Scroll to the specific challenge after navigation
    setTimeout(() => {
      const element = document.getElementById(`challenge-${challengeId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/challenges');
      setSearchQuery('');
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-7 h-8 text-sm bg-muted/50 border-muted-foreground/20 focus:bg-background focus:border-primary/50 transition-colors"
          />
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (suggestions.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => handleSuggestionClick(challenge.id)}
                className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm border-b border-border/50 last:border-b-0"
              >
                <div className="font-medium">{challenge.title}</div>
              </button>
            ))
          ) : searchQuery.trim() && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              No challenges found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
