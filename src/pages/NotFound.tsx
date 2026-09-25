import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { HiOutlineMapPin } from 'react-icons/hi2';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-light-grey flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-primary mb-6">
        <HiOutlineMapPin className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-brand-text mb-2 tracking-tight">Page Not Found</h1>
      <p className="text-sm text-brand-dark-grey max-w-md mb-8 leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back on track.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" size="md" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button variant="primary" size="md" onClick={() => navigate('/login')}>
          Go to Portal Login
        </Button>
      </div>
    </div>
  );
};
export default NotFound;
