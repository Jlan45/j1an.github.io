(function () {
  // --- Rotating Title Logic (Preserved) ---
  const titleNode = document.querySelector("[data-rotating-title]");
  if (titleNode) {
    let titles = [];
    try { titles = JSON.parse(titleNode.dataset.titles || "[]"); } catch (_) { titles = []; }
    if (titles.length > 1) {
      let index = 0;
      const interval = Number(titleNode.dataset.titleInterval) || 2200;
      window.setInterval(function () {
        index = (index + 1) % titles.length;
        titleNode.classList.add("is-switching");
        window.setTimeout(function () {
          titleNode.textContent = titles[index];
          titleNode.classList.remove("is-switching");
        }, 130);
      }, interval);
    }
  }

  // --- Advanced Linux Shell Simulation ---
  const root = document.querySelector("[data-shell]");
  if (!root) return;

  const initialPrompt = root.dataset.prompt || "visitor@rainbow:~$";
  const welcome = root.dataset.welcome || "Type 'help' to see available commands.";
  
  let buffer = "";
  let term;
  let history = [];
  let historyIndex = -1;

  // File System State
  let fs = {};
  try { fs = JSON.parse(root.dataset.fs || "{}"); } catch (e) { console.error("FS Parse Error", e); }
  
  let cwd = [""]; // Root
  const USER = "visitor";
  const HOSTNAME = "rainbow-pixel";

  const getDir = (path) => {
    let curr = fs;
    for (const p of path) {
      if (!p) continue;
      if (curr[p] && curr[p].type === "dir") {
        curr = curr[p].children;
      } else {
        return null;
      }
    }
    return curr;
  };

  const commands = {
    help: () => [
      "Standard Commands:",
      "  ls, cd, cat, pwd, clear, help",
      "System Commands:",
      "  whoami, date, uname, hostname, id, history",
      "Fun Commands:",
      "  sudo, motd"
    ],
    pwd: () => ["/" + cwd.filter(Boolean).join("/")],
    whoami: () => [USER],
    hostname: () => [HOSTNAME],
    date: () => [new Date().toString()],
    uname: (args) => {
      if (args.includes("-a")) return ["CyberOS rainbow-pixel 5.15.0-pixel-art #1 SMP PREEMPT aarch64 GNU/Linux"];
      return ["CyberOS"];
    },
    id: () => [`uid=1000(${USER}) gid=1000(${USER}) groups=1000(${USER}),4(adm),24(cdrom),27(sudo)`],
    history: () => history.map((c, i) => `  ${i + 1}  ${c}`),
    motd: () => [
      " * Documentation:  https://jlan.darkflow.top/",
      " * Support:        https://github.com/Jlan45/",
      "Welcome to Rainbow Pixel OS v1.1.0 LTS",
      "",
      "System information as of " + new Date().toLocaleDateString(),
      "System load:  0.08               Processes:           114",
      "Usage of /:   12.4% of 160GB     Users logged in:     1"
    ],
    ls: (args) => {
      const dir = getDir(cwd);
      if (!dir) return ["ls: cannot access directory"];
      const entries = Object.keys(dir).sort().map(name => {
        const isDir = dir[name].type === "dir";
        return isDir ? `\x1b[1;34m${name}/\x1b[0m` : name;
      });
      return [entries.join("  ") || ""];
    },
    cd: (args) => {
      const target = args[0];
      if (!target || target === "~" || target === "/") { cwd = [""]; return []; }
      if (target === "..") { if (cwd.length > 1) cwd.pop(); return []; }
      
      const parts = target.split("/").filter(Boolean);
      let newPath = target.startsWith("/") ? [""] : [...cwd];
      for (const p of parts) {
        const curr = getDir(newPath);
        if (curr && curr[p] && curr[p].type === "dir") {
          newPath.push(p);
        } else {
          return [`cd: ${target}: No such directory`];
        }
      }
      cwd = newPath;
      return [];
    },
    cat: (args) => {
      const filename = args[0];
      if (!filename) return ["cat: missing operand"];
      const dir = getDir(cwd);
      const file = dir[filename];
      if (!file || file.type !== "file") return [`cat: ${filename}: No such file`];
      
      const result = [file.content || "(empty file)"];
      if (file.url) {
        result.push(`\r\n\x1b[33m[Opening linked content at ${file.url}...]\x1b[0m`);
        setTimeout(() => { window.location.href = file.url; }, 1500);
      }
      return result;
    },
    sudo: (args) => {
      if (args.length === 0) return ["usage: sudo <command>"];
      return ["\x1b[31m[sudo] password for " + USER + ":\x1b[0m", "Sorry, try again."];
    }
  };

  function getPrompt() {
    const path = cwd.length === 1 ? "~" : "/" + cwd.filter(Boolean).join("/");
    return `\x1b[1;32m${USER}@${HOSTNAME}\x1b[0m:\x1b[1;34m${path}\x1b[0m$ `;
  }

  function handleTab() {
    const parts = buffer.trim().split(/\s+/);
    const last = parts[parts.length - 1] || "";
    const dir = getDir(cwd);
    const matches = Object.keys(dir).filter(n => n.startsWith(last));
    
    if (matches.length === 1) {
      const completion = matches[0].slice(last.length);
      buffer += completion;
      term.write(completion);
    } else if (matches.length > 1) {
      term.writeln("\r\n" + matches.join("  "));
      term.write(getPrompt() + buffer);
    }
  }

  function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) { term.write(getPrompt()); return; }
    
    history.push(trimmed);
    historyIndex = -1;

    const [cmd, ...args] = trimmed.split(/\s+/);
    if (cmd === "clear") {
      term.clear();
      term.write("\x1b[H\x1b[2J");
      term.write(getPrompt());
      return;
    }

    const handler = commands[cmd];
    if (handler) {
      const output = handler(args);
      output.forEach(line => term.writeln(line));
    } else {
      term.writeln(`command not found: ${cmd}`);
    }
    term.write(getPrompt());
  }

  function bootTerminal() {
    if (!window.Terminal) return;

    term = new window.Terminal({
      cols: 60, rows: 15, cursorBlink: true, convertEol: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      theme: {
        background: "#17151f", foreground: "#f7f7f7", cursor: "#ffed00",
        black: "#17151f", red: "#e40303", green: "#6fffc6", yellow: "#ffed00",
        blue: "#42d7f5", magenta: "#ff9fce", cyan: "#42d7f5", white: "#f7f7f7"
      }
    });

    term.open(root);
    term.writeln("\x1b[38;2;66;215;245mRainbow Pixel Shell v1.2.0 (Stable)\x1b[0m");
    term.writeln(welcome);
    term.write(getPrompt());

    term.onData(data => {
      const code = data.charCodeAt(0);
      if (data === "\r") {
        term.write("\r\n");
        runCommand(buffer);
        buffer = "";
      } else if (code === 127) { // Backspace
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          term.write("\b \b");
        }
      } else if (code === 9) { // Tab
        handleTab();
      } else if (data === "\x1b[A") { // Up Arrow
        if (history.length > 0) {
          if (historyIndex === -1) historyIndex = history.length - 1;
          else if (historyIndex > 0) historyIndex--;
          
          term.write("\x1b[2K\r" + getPrompt() + history[historyIndex]);
          buffer = history[historyIndex];
        }
      } else if (data === "\x1b[B") { // Down Arrow
        if (historyIndex !== -1) {
          if (historyIndex < history.length - 1) {
            historyIndex++;
            term.write("\x1b[2K\r" + getPrompt() + history[historyIndex]);
            buffer = history[historyIndex];
          } else {
            historyIndex = -1;
            term.write("\x1b[2K\r" + getPrompt());
            buffer = "";
          }
        }
      } else if (code >= 32) {
        buffer += data;
        term.write(data);
      }
    });
  }

  root.addEventListener("click", () => term && term.focus());
  bootTerminal();
})();
