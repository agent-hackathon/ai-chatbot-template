'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { artifactDefinitions, type ArtifactKind } from './artifact';
import type { Suggestion } from '@/lib/db/schema';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';

export type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'sheet-delta'
    | 'image-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'kind';
  content: string | Suggestion;
};

// Type guard to check if a value is a DataStreamDelta
const isDataStreamDelta = (value: unknown): value is DataStreamDelta => {
  if (typeof value !== 'object' || value === null) return false;
  const delta = value as DataStreamDelta;
  return (
    typeof delta.type === 'string' &&
    Object.values(['text-delta', 'code-delta', 'sheet-delta', 'image-delta', 'title', 'id', 'suggestion', 'clear', 'finish', 'kind']).includes(delta.type) &&
    (typeof delta.content === 'string' || (delta.content as Suggestion)?.content !== undefined)
  );
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream, messages, append } = useChat({ id });
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);
  const [currentContent, setCurrentContent] = useState(''); // Track real-time content for UI

  useEffect(() => {
    if (!dataStream?.length) return;

    console.log('🔥 DataStreamHandler - New dataStream length:', dataStream.length, 'Messages:', messages.length);

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    newDeltas.forEach((item: unknown) => {
      if (isDataStreamDelta(item)) {
        const delta = item as DataStreamDelta;
        console.log('🔥 DataStreamHandler - Processing delta:', delta);

        const artifactDefinition = artifactDefinitions.find((ad) => ad.kind === artifact.kind);

        if (artifactDefinition?.onStreamPart) {
          artifactDefinition.onStreamPart({ streamPart: delta, setArtifact, setMetadata });
        }

        setArtifact((draftArtifact) => {
          if (!draftArtifact) return { ...initialArtifactData, status: 'streaming' };

          switch (delta.type) {
            case 'text-delta':
              console.log('🔥 DataStreamHandler - Appending text-delta:', delta.content);
              const newContent = (draftArtifact.content || '') + delta.content;
              setCurrentContent(newContent); // Update UI state immediately
              return { ...draftArtifact, content: newContent, status: 'streaming' };
            case 'id':
              return { ...draftArtifact, documentId: delta.content as string, status: 'streaming' };
            case 'title':
              return { ...draftArtifact, title: delta.content as string, status: 'streaming' };
            case 'kind':
              return { ...draftArtifact, kind: delta.content as ArtifactKind, status: 'streaming' };
            case 'clear':
              setCurrentContent(''); // Clear UI state
              return { ...draftArtifact, content: '', status: 'streaming' };
            case 'finish':
              return { ...draftArtifact, status: 'idle' };
            default:
              return draftArtifact;
          }
        });
      } else {
        console.log('🔥 DataStreamHandler - Skipping non-DataStreamDelta item:', item);
      }
    });
  }, [dataStream, setArtifact, setMetadata, artifact, messages]);

  return null;
}