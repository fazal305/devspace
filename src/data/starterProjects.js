// Structured starter-project data. New templates are added here, never
// hardcoded inside a component — see entryRepository.seedFromTemplate for
// how a template's `entries` list is materialized into real DB rows.

export const starterProjects = [
  {
    id: "blank",
    name: "Blank Project",
    description: "Start from an empty project.",
    entries: [],
  },
  {
    id: "vanilla-js",
    name: "Vanilla JS Project",
    description: "A plain HTML/CSS/JS starting point.",
    entries: [
      {
        path: "index.html",
        language: "html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Vanilla JS Project</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1 id="title">Hello, DevSpace</h1>
    <script src="main.js"></script>
  </body>
</html>
`,
      },
      {
        path: "style.css",
        language: "css",
        content: `body {
  font-family: sans-serif;
  margin: 2rem;
}

#title {
  color: #3b66d4;
}
`,
      },
      {
        path: "main.js",
        language: "javascript",
        content: `document.getElementById("title").addEventListener("click", () => {
  console.log("Title clicked");
});
`,
      },
    ],
  },
  {
    id: "react-project",
    name: "React Project",
    description: "A minimal React component tree.",
    entries: [
      {
        path: "src/App.jsx",
        language: "jsx",
        content: `export default function App() {
  return (
    <main>
      <h1>Hello, DevSpace</h1>
    </main>
  );
}
`,
      },
      {
        path: "src/main.jsx",
        language: "jsx",
        content: `import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
`,
      },
      {
        path: "README.md",
        language: "markdown",
        content: `# React Project

A starter React component tree. Edit \`src/App.jsx\` to get going.
`,
      },
    ],
  },
  {
    id: "json-playground",
    name: "JSON Playground",
    description: "Sandbox for exploring JSON structures.",
    entries: [
      {
        path: "data.json",
        language: "json",
        content: `{
  "workspace": "DevSpace",
  "features": ["projects", "snippets", "offline"],
  "version": 1
}
`,
      },
    ],
  },
  {
    id: "sql-playground",
    name: "SQL Playground",
    description: "Sandbox for sketching schemas and queries.",
    entries: [
      {
        path: "schema.sql",
        language: "sql",
        content: `CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

SELECT * FROM projects ORDER BY created_at DESC;
`,
      },
    ],
  },
];
