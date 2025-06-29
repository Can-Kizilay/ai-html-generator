import React, { useEffect, useRef, useState } from "react";
import Toaster from "./Toaster";
import { v4 as uuidv4 } from 'uuid';
import "./App.css";
import HtmlRenderer from "./HtmlRenderer";
import { GoogleGenAI } from "@google/genai";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import SlSkeleton from "@shoelace-style/shoelace/dist/react/skeleton";

// IMPORTANT: Replace with your actual Gemini API Key. Load securely (e.g., from environment variables).
// For a Create React App, you can use process.env.GEMINI_API_KEY
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "REACT_APP_GEMINI_API_KEY environment variable is not set. Please create a .env file in the project root with REACT_APP_GEMINI_API_KEY=YOUR_API_KEY"
  );
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [combinedHtml, setCombinedHtml] = useState("");
  const [generatedCss, setGeneratedCss] = useState("");
  const [generatedJs, setGeneratedJs] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isInputVisible, setIsInputVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [savedComponents, setSavedComponents] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const [toastMessages, setToastMessages] = useState<any[]>([]);

  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const shareDropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = uuidv4();
    setToastMessages((prevMessages) => [...prevMessages, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3000); // Toast disappears after 3 seconds
  };

  const removeToast = (id: string) => {
    setToastMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== id)
    );
  };

  useEffect(() => {
    loadSavedComponents();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        historyDropdownRef.current &&
        !historyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        shareDropdownRef.current &&
        !shareDropdownRef.current.contains(event.target as Node)
      ) {
        setIsShareDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadSavedComponents = () => {
    try {
      const storedComponents = localStorage.getItem("generatedHtmlComponents");
      if (storedComponents) {
        setSavedComponents(JSON.parse(storedComponents));
      }
    } catch (error) {
      console.error("Failed to load components from local storage", error);
    }
  };

  const saveComponent = (component: any) => {
    setSavedComponents((prevComponents) => {
      const updatedComponents = [component, ...prevComponents].slice(0, 25);
      localStorage.setItem(
        "generatedHtmlComponents",
        JSON.stringify(updatedComponents)
      );
      return updatedComponents;
    });
  };

  const handleDeleteComponent = (timestamp: string) => {
    setSavedComponents((prevComponents) => {
      const updatedComponents = prevComponents.filter(
        (comp) => comp.timestamp !== timestamp
      );
      localStorage.setItem(
        "generatedHtmlComponents",
        JSON.stringify(updatedComponents)
      );
      return updatedComponents;
    });
    showToast("Component deleted from history.", 'info');
  };

  const handleLoadComponent = (component: any) => {
    setCombinedHtml(
      `<style>${component.css}</style>${component.html}<script>${component.js}</script>`
    );
    setGeneratedHtml(component.html);
    setGeneratedCss(component.css);
    setGeneratedJs(component.js || "");
    setDescription(component.description || "No description provided.");
    setIsDropdownOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleShareAsGist = async () => {
    if (!generatedHtml && !generatedCss && !generatedJs) {
      showToast("No content to share.", 'info');
      return;
    }

    const gistContent = {
      description: description || "Generated HTML Component",
      public: true,
      files: {
        "index.html": {
          content: generatedHtml,
        },
        "style.css": {
          content: generatedCss,
        },
        "script.js": {
          content: generatedJs,
        },
      },
    };

    try {
      const files: { [key: string]: { content: string } } = {};
      if (generatedHtml) {
        files["index.html"] = { content: generatedHtml };
      }
      if (generatedCss) {
        files["style.css"] = { content: generatedCss };
      }
      if (generatedJs) {
        files["script.js"] = { content: generatedJs };
      }

      const form = document.createElement("form");
      form.setAttribute("method", "POST");
      form.setAttribute("action", "https://gist.github.com/");
      form.setAttribute("target", "_blank");

      const descriptionInput = document.createElement("input");
      descriptionInput.setAttribute("type", "hidden");
      descriptionInput.setAttribute("name", "description");
      descriptionInput.setAttribute("value", description || "Generated HTML Component");
      form.appendChild(descriptionInput);

      const publicInput = document.createElement("input");
      publicInput.setAttribute("type", "hidden");
      publicInput.setAttribute("name", "public");
      publicInput.setAttribute("value", "true");
      form.appendChild(publicInput);

      Object.entries(files).forEach(([filename, fileContent]) => {
        const fileInput = document.createElement("textarea");
        fileInput.setAttribute("name", `file[${filename}]`);
        fileInput.textContent = fileContent.content;
        form.appendChild(fileInput);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      showToast("Redirecting to GitHub Gist to create your Gist.", 'info');
    } catch (error: any) {
      showToast(`Error preparing Gist: ${error.message}`, 'error');
      console.error("Gist preparation error:", error);
    } finally {
      setIsShareDropdownOpen(false);
    }
  };

  const handleShareAsRaw = () => {
    if (!combinedHtml) {
      showToast("No content to share.", 'info');
      return;
    }
    navigator.clipboard.writeText(combinedHtml);
    showToast("Combined HTML, CSS, and JS copied to clipboard!", 'success');
    setIsShareDropdownOpen(false);
  };

  const toggleLayout = () => {
    setLayout(layout === "horizontal" ? "vertical" : "horizontal");
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    const { scrollTop } = event.currentTarget;

    if (scrollTop > lastScrollTop.current) {
      setIsHeaderVisible(false);
      setIsInputVisible(false);
    } else {
      setIsHeaderVisible(true);
      setIsInputVisible(true);
    }

    lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      setIsHeaderVisible(true);
      setIsInputVisible(true);
    }, 2000);
  };

  const handleGenerate = async (isImprovement = false) => {
    setError(null);
    setLoading(true);

    if (!isImprovement) {
      setCombinedHtml("");
      setGeneratedHtml("");
      setGeneratedJs("");
      setGeneratedCss("");
      setDescription("");
    }

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });

      let fullPrompt;
      if (isImprovement) {
        fullPrompt = `Improve the following HTML, CSS, and JavaScript code based on the
        prompt: ${prompt}.
        description: ${description}. 
        Current HTML: ${generatedHtml}
        Current CSS: ${generatedCss}
        Current JS: ${generatedJs}
        Provide the output as a JSON object with four fields: 'html' (string), 'css' (string), 'js' (string) and 'description' (string, a brief summary of the generated component). 
        Improve this code.`;
      } else {
        fullPrompt = `Generate an HTML component and its corresponding CSS based on the following description. 
        Provide the output as a JSON object with four fields: 'html' (string), 'css' (string), 'js' (string) and 'description' (string, a brief summary of the generated component). 
        Ensure the HTML is a single, self-contained component.  Use "https://picsum.photos/" for images. Html variable shouldn't have any css or js code. All css and js code should be in the css and js variables.
        Description: ${prompt}`;
      }

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
      });

      const rawResponseText = result.text ?? "";

      // Extract JSON string from markdown code block
      const jsonMatch = rawResponseText.match(/```json\n([\s\S]*?)\n```/);
      let jsonString = rawResponseText;

      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
      }

      // Attempt to parse the extracted text as JSON
      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (jsonError) {
        throw new Error(
          "API response was not valid JSON or could not be extracted. Raw response: " +
            rawResponseText +
            ", Parsed JSON string attempt: " +
            jsonString
        );
      }

      if (data.html && data.css) {
        let fullHtml = data.html;

        // Add CSS to the HTML
        if (data.css) {
          fullHtml = `<style>${data.css}</style>${fullHtml}`;
        }

        // Add JavaScript to the HTML
        if (data.js) {
          fullHtml = `${fullHtml}<script>${data.js}</script>`;
        }

        setCombinedHtml(fullHtml); // Set the combined HTML for rendering
        setGeneratedHtml(data.html); // Keep separate for copying
        setGeneratedCss(data.css); // Keep separate for copying
        setGeneratedJs(data.js || ""); // Keep separate for copying
        setDescription(data.description || "No description provided.");

        saveComponent({
          html: data.html,
          css: data.css,
          js: data.js || "",
          description: data.description || "No description provided.",
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error(
          "Malformed API response: Missing HTML or CSS content in JSON."
        );
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during API call.");
      console.error("Gemini API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  function handleCopy(generatedCode: string, codeType: string): void {
    navigator.clipboard.writeText(generatedCode);
    showToast(`${codeType} code copied to clipboard!`, 'success');
  }

  const codePanel = (
    <Panel>
      <div className="output-code-section">
        {description && (
          <div className="description-area">
            <h3>Description:</h3>
            <p>{description}</p>
          </div>
        )}

        {(generatedHtml || generatedCss || generatedJs) && (
          <div className="code-display-sections">
            {generatedHtml && (
              <div className="code-section">
                <h3>HTML Code</h3>
                <button onClick={() => handleCopy(generatedHtml, "HTML")}>
                  Copy HTML
                </button>
                <pre>
                  <code>{generatedHtml}</code>
                </pre>
              </div>
            )}
            {generatedCss && (
              <div className="code-section">
                <h3>CSS Code</h3>
                <button onClick={() => handleCopy(generatedCss, "CSS")}>
                  Copy CSS
                </button>
                <pre>
                  <code>{generatedCss}</code>
                </pre>
              </div>
            )}
            {generatedJs && (
              <div className="code-section">
                <h3>JavaScript Code</h3>
                <button onClick={() => handleCopy(generatedJs, "JavaScript")}>
                  Copy JS
                </button>
                <pre>
                  <code>{generatedJs}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );

  const previewPanel = (
    <Panel>
      <div className="output-preview-section">
        {error && <p className="error-message">Error: {error}</p>}
        {loading && (
          <div className="skeleton-overview">
            <header>
              <SlSkeleton />
              <SlSkeleton />
            </header>
            <SlSkeleton />
            <SlSkeleton />
            <SlSkeleton />
          </div>
        )}
        {generatedHtml && (
          <HtmlRenderer
            htmlContent={generatedHtml}
            cssContent={generatedCss}
            jsContent={generatedJs}
            theme={theme}
          />
        )}
      </div>
    </Panel>
  );

  return (
    <div className="App" data-theme={theme}>
      <header className="App-header" style={{ top: isHeaderVisible ? 0 : -70 }}>
        <div className="title-container">
          <h1>HTML Component Generator</h1>
        </div>
        <div className="header-controls">
          <div className="theme-switcher">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <label className="switch">
              <input
                type="checkbox"
                onChange={toggleTheme}
                checked={theme === "dark"}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="layout-switcher">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <label className="switch">
              <input
                type="checkbox"
                onChange={toggleLayout}
                checked={layout === "vertical"}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="history-dropdown" ref={historyDropdownRef}>
            <button
              className="dropdown-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={savedComponents.length === 0}
            >
              History
            </button>
            {isDropdownOpen && savedComponents.length > 0 && (
              <div className="dropdown-content">
                {savedComponents.map((comp, index) => (
                  <div key={index} className="dropdown-item-wrapper">
                    <a onClick={() => handleLoadComponent(comp)}>
                      <span className="dropdown-item-description">
                        {comp.description || `Component ${index + 1}`}
                      </span>
                      <span className="dropdown-item-timestamp">
                        {new Date(comp.timestamp).toLocaleString()}
                      </span>
                    </a>
                    <button
                      className="delete-history-item-button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering handleLoadComponent
                        handleDeleteComponent(comp.timestamp);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="share-dropdown" ref={shareDropdownRef}>
            <button
              className="dropdown-button"
              onClick={() => setIsShareDropdownOpen(!isShareDropdownOpen)}
              disabled={!combinedHtml}
            >
              Share
            </button>
            {isShareDropdownOpen && (
              <div className="dropdown-content">
                <a onClick={handleShareAsGist}>Share as Gist</a>
                <a onClick={handleShareAsRaw}>Copy Raw HTML/CSS/JS</a>
              </div>
            )}
          </div>
        </div>
      </header>
      <main
        className={`App-main ${!isHeaderVisible ? "scrolled-down" : ""}`}
        onScroll={handleScroll}
      >
        <div className="output-section">
          {!combinedHtml && !loading && !error && (
            <p>Your generated HTML component will appear here.</p>
          )}
          {combinedHtml && !loading && !error && (
            <PanelGroup direction={layout}>
              {layout === "horizontal" ? (
                <>
                  {codePanel}
                  <PanelResizeHandle className="resize-handle" />
                  {previewPanel}
                </>
              ) : (
                <>
                  {previewPanel}
                  <PanelResizeHandle className="resize-handle" />
                  {codePanel}
                </>
              )}
            </PanelGroup>
          )}
        </div>
        <div
          className="input-section"
          style={{ bottom: isInputVisible ? 0 : -100 }}
        >
          <textarea
            className="prompt-textarea"
            placeholder="Describe the HTML component you want to generate (e.g., 'A responsive navigation bar with a logo and three menu items')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
          ></textarea>
          <button
            className="generate-button"
            onClick={() => handleGenerate(false)}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate HTML"}
          </button>
          <button
            className="improve-button"
            onClick={() => handleGenerate(true)}
            disabled={!combinedHtml || loading}
          >
            Improve
          </button>
        </div>
      </main>
      <Toaster messages={toastMessages} removeMessage={removeToast} />
    </div>
  );
}

export default App;
