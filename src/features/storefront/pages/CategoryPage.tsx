import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) {
      navigate(`/catalog?category=${encodeURIComponent(slug)}`, { replace: true });
    } else {
      navigate('/catalog', { replace: true });
    }
  }, [slug, navigate]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default CategoryPage;
