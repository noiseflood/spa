/**
 * useSPALoader Hook - Loads and parses SPA files
 */

import { useState, useCallback, useEffect } from 'react';
import { parseSPA } from '@spa-audio/core';
import type { SPADocument, ParseOptions } from '@spa-audio/types';

export interface SPALoaderState {
  document: SPADocument | null;
  isLoading: boolean;
  error: Error | null;
  rawXML: string | null;
}

export interface UseSPALoaderOptions extends ParseOptions {
  autoLoad?: boolean;
  cache?: boolean;
}

// Simple in-memory cache for SPA documents
const documentCache = new Map<string, SPADocument>();
const xmlCache = new Map<string, string>();

export function useSPALoader(
  url?: string,
  options: UseSPALoaderOptions = {}
) {
  const {
    autoLoad = true,
    cache = true,
    ...parseOptions
  } = options;

  const [state, setState] = useState<SPALoaderState>({
    document: null,
    isLoading: false,
    error: null,
    rawXML: null
  });

  // Load SPA file from URL
  const loadFromURL = useCallback(async (spaUrl: string): Promise<SPADocument> => {
    // Check cache first
    if (cache && documentCache.has(spaUrl)) {
      const cached = documentCache.get(spaUrl)!;
      setState({
        document: cached,
        isLoading: false,
        error: null,
        rawXML: xmlCache.get(spaUrl) || null
      });
      return cached;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const response = await fetch(spaUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch SPA file: ${response.statusText}`);
      }

      const xml = await response.text();
      const document = parseSPA(xml, parseOptions);

      // Cache the result
      if (cache) {
        documentCache.set(spaUrl, document);
        xmlCache.set(spaUrl, xml);
      }

      setState({
        document,
        isLoading: false,
        error: null,
        rawXML: xml
      });

      return document;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        document: null,
        isLoading: false,
        error: err,
        rawXML: null
      });
      throw err;
    }
  }, [cache, parseOptions]);

  // Load SPA from XML string
  const loadFromXML = useCallback((xml: string): SPADocument => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const document = parseSPA(xml, parseOptions);

      setState({
        document,
        isLoading: false,
        error: null,
        rawXML: xml
      });

      return document;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        document: null,
        isLoading: false,
        error: err,
        rawXML: xml
      });
      throw err;
    }
  }, [parseOptions]);

  // Load SPA from File object (for file uploads)
  const loadFromFile = useCallback(async (file: File): Promise<SPADocument> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const xml = await file.text();
      return loadFromXML(xml);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        document: null,
        isLoading: false,
        error: err,
        rawXML: null
      });
      throw err;
    }
  }, [loadFromXML]);

  // Clear the current document
  const clear = useCallback(() => {
    setState({
      document: null,
      isLoading: false,
      error: null,
      rawXML: null
    });
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    documentCache.clear();
    xmlCache.clear();
  }, []);

  // Auto-load on mount if URL provided
  useEffect(() => {
    if (autoLoad && url) {
      loadFromURL(url);
    }
  }, [autoLoad, url, loadFromURL]);

  return {
    ...state,
    loadFromURL,
    loadFromXML,
    loadFromFile,
    clear,
    clearCache
  };
}

export default useSPALoader;