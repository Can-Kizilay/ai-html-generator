import React, { useEffect, useRef } from 'react';
import styles from './HtmlRenderer.module.css';

interface HtmlRendererProps {
  htmlContent: string;
  theme: string;
}

const HtmlRenderer: React.FC<HtmlRendererProps> = ({ htmlContent, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content and scripts
    containerRef.current.innerHTML = '';
    const scripts: HTMLScriptElement[] = [];

    // Create a temporary div to parse the htmlContent
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Extract script elements and other HTML
    const scriptElements = tempDiv.querySelectorAll('script');
    scriptElements.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      scripts.push(newScript);
      script.remove(); // Remove script from tempDiv so it's not added via innerHTML
    });

    // Set the remaining HTML (without scripts) using dangerouslySetInnerHTML
    // This is safe because we've removed the script tags
    containerRef.current.innerHTML = tempDiv.innerHTML;
    
    // Apply the theme to the container
    if (containerRef.current) {
      containerRef.current.setAttribute('data-theme', theme);
    }

    // Append and execute scripts
    scripts.forEach(script => {
      containerRef.current?.appendChild(script);
    });

    // Cleanup function: remove dynamically added scripts when component unmounts or htmlContent changes
    return () => {
      scripts.forEach(script => {
        script.remove();
      });
    };
  }, [htmlContent, theme]); // Re-run effect when htmlContent or theme changes

  return (
    <div className={styles.container} ref={containerRef} data-theme={theme} />
  );
};

export default HtmlRenderer;