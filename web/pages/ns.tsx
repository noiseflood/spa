import Head from 'next/head';

export default function Namespace() {
  return (
    <>
      <Head>
        <title>SPA Namespace - Synthetic Parametric Audio</title>
        <meta name="description" content="Official namespace for SPA (Synthetic Parametric Audio) v1.0 specification" />
      </Head>
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>SPA (Synthetic Parametric Audio)</h1>
        <p><strong>Namespace:</strong> <code>https://spa.audio/ns</code></p>
        <p><strong>Version:</strong> 1.0</p>
        <p><strong>Status:</strong> Stable</p>
        
        <h2>About</h2>
        <p>
          SPA (Synthetic Parametric Audio) is a declarative XML format for defining 
          procedural sound effects. Think of it as "the SVG of sound effects."
        </p>
        
        <h2>Specification</h2>
        <p>
          <a href="/docs/spec">View Full Specification →</a>
        </p>
        
        <h2>Schema</h2>
        <p>
          <a href="https://github.com/yourusername/spa/blob/main/schema/spa-v1.0.schema.json">
            JSON Schema Definition →
          </a>
        </p>
        
        <h2>Example Usage</h2>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
{`<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="800" dur="0.05" 
        envelope="0,0.02,0,0.03"/>
</spa>`}
        </pre>
        
        <h2>Tools</h2>
        <ul>
          <li><a href="/">Visual Designer</a> - Design sounds visually</li>
          <li><a href="/playground">Code Playground</a> - Write SPA code</li>
          <li><a href="/examples">Example Library</a> - Browse examples</li>
        </ul>
        
        <h2>Packages</h2>
        <ul>
          <li><code>@spa-audio/core</code> - Core parser and renderer</li>
          <li><code>@spa-audio/react</code> - React integration</li>
          <li><code>@spa-audio/types</code> - TypeScript definitions</li>
        </ul>
        
        <h2>License</h2>
        <p>MIT License - Free for commercial and personal use</p>
        
        <footer style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #ddd', color: '#666' }}>
          <p>
            <a href="https://github.com/yourusername/spa">GitHub</a> | 
            <a href="/docs"> Documentation</a> | 
            <a href="https://www.npmjs.com/org/spa"> npm</a>
          </p>
        </footer>
      </div>
    </>
  );
}