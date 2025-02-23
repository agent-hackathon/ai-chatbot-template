'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef } from 'react';
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

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream, messages, append } = useChat({ id }); // Add messages for debugging
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    console.log('🔥 DataStreamHandler - New dataStream length:', dataStream.length, 'Messages:', messages.length);

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    newDeltas.forEach((delta: DataStreamDelta) => {
      console.log('🔥 DataStreamHandler - Processing delta:', delta);

      const artifactDefinition = artifactDefinitions.find(
        (ad) => ad.kind === artifact.kind
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'text-delta':
            console.log('🔥 DataStreamHandler - Appending text-delta:', delta.content);
            return {
              ...draftArtifact,
              content: (draftArtifact.content || '') + delta.content,
              status: 'streaming',
            };
          case 'id':
            return { ...draftArtifact, documentId: delta.content as string, status: 'streaming' };
          case 'title':
            return { ...draftArtifact, title: delta.content as string, status: 'streaming' };
          case 'kind':
            return { ...draftArtifact, kind: delta.content as ArtifactKind, status: 'streaming' };
          case 'clear':
            return { ...draftArtifact, content: '', status: 'streaming' };
          case 'finish':
            return { ...draftArtifact, status: 'idle' };
          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, setArtifact, setMetadata, artifact, messages]);

  return null;
}