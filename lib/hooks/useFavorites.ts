import { useState, useEffect, useCallback } from 'react';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/favorites');
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      setFavoriteIds(data.favoriteIds || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (fictionalUserId: string) => {
    const isFavorited = favoriteIds.includes(fictionalUserId);
    const action = isFavorited ? 'remove' : 'add';

    // Optimistic update
    setFavoriteIds(prev =>
      isFavorited
        ? prev.filter(id => id !== fictionalUserId)
        : [...prev, fictionalUserId]
    );

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fictional_user_id: fictionalUserId,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite');
      }

      const data = await response.json();
      
      // Update based on server response
      setFavoriteIds(prev =>
        data.isFavorited
          ? prev.includes(fictionalUserId) ? prev : [...prev, fictionalUserId]
          : prev.filter(id => id !== fictionalUserId)
      );

      return data.isFavorited;
    } catch (err) {
      console.error('Error toggling favorite:', err);
      
      // Revert optimistic update on error
      setFavoriteIds(prev =>
        isFavorited
          ? [...prev, fictionalUserId]
          : prev.filter(id => id !== fictionalUserId)
      );
      
      throw err;
    }
  }, [favoriteIds]);

  const isFavorited = useCallback(
    (fictionalUserId: string) => favoriteIds.includes(fictionalUserId),
    [favoriteIds]
  );

  return {
    favoriteIds,
    isLoading,
    error,
    toggleFavorite,
    isFavorited,
    refetch: fetchFavorites,
  };
}
