import React from 'react';
import { ExternalLink } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SearchResultCardProps {
  title: string;
  snippet: string;
  url: string;
}

export function SearchResultCard({ title, snippet, url }: SearchResultCardProps) {
  // Function to sanitize HTML from the title and snippet
  const sanitizeHTML = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  // Open URL in a new tab
  const openUrl = () => {
    if (url && url !== '') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="mb-3 overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium line-clamp-2">
          {sanitizeHTML(title)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription className="line-clamp-3">
          {sanitizeHTML(snippet)}
        </CardDescription>
      </CardContent>
      {url && url !== '' && (
        <CardFooter className="pt-0 flex justify-between items-center">
          <span className="text-xs text-muted-foreground truncate max-w-[70%]">
            {url}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openUrl}
            className="ml-2"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Visit
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 