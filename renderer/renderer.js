import { editor, monaco } from "./editor/editor.js";
import "./fileManager/fileManager.js";
import {
  createNewFile,
  createNewDir,
  createNewFileInRoot,
  createNewDirInRoot,
} from "./fileManager/fileManager.js";
import { callChatApi } from "./chatService.js";
function showToast(message, success = true) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast" + (success ? "" : " error");
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("hide");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3000);
}

function sendEnterToTerminal() {
  window.electronAPI.sendToTerminal("\r");
}

function sendCommandToTerminal(command) {
  window.electronAPI.sendToTerminal(`${command}\r`);
}

async function setCursorLine(lineStr) {
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    editor.setPosition({ lineNumber: line, column: 1 });
    editor.focus();
  }
}

async function selectLine(lineStr) {
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    const maxCol = editor.getModel().getLineMaxColumn(line);
    editor.setSelection(new monaco.Range(line, 1, line, maxCol));
    editor.focus();
  }
}

async function selectRange(fromStr, toStr) {
  const from = parseInt(fromStr, 10);
  const to = parseInt(toStr, 10);
  if (!isNaN(from) && !isNaN(to) && from >= 1 && to >= from) {
    const maxCol = editor.getModel().getLineMaxColumn(to);
    editor.setSelection(new monaco.Range(from, 1, to, maxCol));
    editor.focus();
  }
}

async function insertSnippet(lineStr, snippet) {
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    editor.executeEdits("insert-frag", [
      {
        range: new monaco.Range(line, 1, line, 1),
        text: snippet + "\n",
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }
}

async function deleteLine(lineStr) {
  const line = parseInt(lineStr, 10);
  if (!isNaN(line) && line >= 1) {
    editor.executeEdits("delete-line", [
      {
        range: new monaco.Range(line, 1, line + 1, 1),
        text: "",
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  }
}


function isVisible(item) {
  let el = item;
  while (el && el.id !== "file-tree") {
    if (el.tagName === "UL" && el.classList.contains("collapsed")) return false;
    el = el.parentElement;
  }
  return true;
}

function openFolderByName(name) {
  name = name.trim().toLowerCase();
  const candidates = Array.from(document.querySelectorAll("li.folder")).filter(
    (candidate) => {
      const text = candidate
        .querySelector(".file-name")
        .textContent.trim()
        .toLowerCase();
      return text === name && isVisible(candidate);
    }
  );
  if (candidates.length) {
    candidates[0].click();
    candidates[0].scrollIntoView({ block: "center" });
    return true;
  }
  return false;
}

function openFileByName(name) {
  name = name.trim().toLowerCase();
  const candidates = Array.from(document.querySelectorAll("li.file")).filter(
    (candidate) => {
      let text = candidate
        .querySelector(".file-name")
        .textContent.trim()
        .toLowerCase();
      if (!name.includes(".")) {
        const base = text.includes(".")
          ? text.slice(0, text.lastIndexOf("."))
          : text;
        return base === name && isVisible(candidate);
      }
      return text === name && isVisible(candidate);
    }
  );
  if (candidates.length) {
    candidates[0].click();
    candidates[0].scrollIntoView({ block: "center" });
    return true;
  }
  return false;
}

async function createFileInFolder(folder, name) {
  if (!folder || !name) return;
  if (!openFolderByName(folder)) {
    showToast(`No se encontró la carpeta “${folder}”`, false);
    return;
  }
  createNewFile(name);
}

async function createDirInFolder(folder, name) {
  if (!folder || !name) return;
  if (!openFolderByName(folder)) {
    showToast(`No se encontró la carpeta “${folder}”`, false);
    return;
  }
  createNewDir(name);
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function initializeVoicePanel() {
  const recordBtn = document.getElementById("voice-record");
  const playback = document.getElementById("voice-playback");
  let mediaRecorder,
    audioChunks = [],
    currentStream = null;

  recordBtn.addEventListener("click", async () => {
    console.log("[Voice] click en botón:", recordBtn.textContent);

    if (recordBtn.textContent === "Grabar") {
      audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      currentStream = stream;

      const desiredMime = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "";
      const options = desiredMime ? { mimeType: desiredMime } : undefined;
      mediaRecorder = options
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      console.log("[Voice] MediaRecorder mimeType:", mediaRecorder.mimeType);
      mediaRecorder.start();
      recordBtn.classList.add("recording");
      document.getElementById("voicePanel").classList.add("recording");
      recordBtn.textContent = "Detener";

      mediaRecorder.addEventListener("dataavailable", (e) => {
        console.log(
          "[Voice] dataavailable – size:",
          e.data.size,
          "type:",
          e.data.type
        );
        audioChunks.push(e.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        const loadingMessageId = addUserMessageLoading();
        console.log("[Voice] stop – chunks:", audioChunks.length);
        const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        console.log("[Voice] Blob – size:", blob.size, "type:", blob.type);

        try {
          if (playback) {
            playback.src = URL.createObjectURL(blob);
            await playback.play();
            console.log("[Voice] playing audio");
          }
        } catch {}

        const arrayBuffer = await blob.arrayBuffer();
        const transcription = await window.electronAPI.transcribeVoice(
          new Uint8Array(arrayBuffer),
          blob.type
        );
        updateUserMessage(loadingMessageId, transcription);

        let summaryResponse = "[no se detectó voz]";
        let functionKeyGot = null;
        let outParamsGot = [];

        let status = false;

        const sysLoaderId = addSystemMessageLoading();

        try {
          const {
            match,
            allParams,
            functionKey,
            groupKey,
            outParams,
            summary,
          } = await callChatApi(transcription);

          console.log("--- ChatGPT Response ---");
          console.log({
            match,
            allParams,
            functionKey,
            groupKey,
            outParams,
            summary,
          });

          showToast(summary);
          summaryResponse = summary;
          functionKeyGot = functionKey;
          outParamsGot = outParams;

          if (match === true && allParams === true) {
            status = true;
          }
        } catch (err) {
          console.error("Error calling /chat endpoint:", err);
          showToast("Error al consultar ChatGPT", false);
        }

        switch (functionKeyGot) {
          case "#TERMINAL_EMPTY_ENTER":
            sendEnterToTerminal();
            break;

          case "#TERMINAL_COMMAND":
            {
              const cmdParam = outParamsGot.find(
                (p) => p.paramKey === "#COMMAND"
              );
              if (cmdParam && cmdParam.value) {
                sendCommandToTerminal(cmdParam.value);
              } else {
                console.warn("No se encontró parámetro #COMMAND en outParams");
              }
            }
            break;

          case "#MOVE_CURSOR_TO_LINE":
            {
              const param = outParamsGot.find(
                (p) => p.paramKey === "#LINE_NUMBER"
              );
              if (param && param.value) {
                setCursorLine(param.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#SELECT_LINE":
            {
              const param = outParamsGot.find(
                (p) => p.paramKey === "#LINE_NUMBER"
              );
              if (param && param.value) {
                selectLine(param.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#SELECT_LINE_RANGE":
            {
              const paramFrom = outParamsGot.find(
                (p) => p.paramKey === "#START_LINE"
              );
              const paramTo = outParamsGot.find(
                (p) => p.paramKey === "#END_LINE"
              );
              if (paramFrom && paramFrom.value) {
                selectRange(paramFrom.value, paramTo.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#INSERT_CODE":
            {
              const lineNumber = outParamsGot.find(
                (p) => p.paramKey === "#LINE_NUMBER"
              );
              const genCode = outParamsGot.find(
                (p) => p.paramKey === "#GENERATED_CODE"
              );
              if (lineNumber && lineNumber.value) {
                insertSnippet(lineNumber.value, genCode.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#DELETE_LINE":
            {
              const lineNumber = outParamsGot.find(
                (p) => p.paramKey === "#LINE_NUMBER"
              );
              if (lineNumber && lineNumber.value) {
                deleteLine(lineNumber.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#OPEN_FOLDER":
            {
              const name = outParamsGot.find(
                (p) => p.paramKey === "#OPENED_FOLDER_NAME"
              );
              if (name && name.value) {
                openFolderByName(name.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#OPEN_FILE":
            {
              const name = outParamsGot.find(
                (p) => p.paramKey === "#OPENED_FILE_NAME"
              );
              if (name && name.value) {
                openFileByName(name.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#NEW_FILE_ROOT":
            {
              const name = outParamsGot.find(
                (p) => p.paramKey === "#CREATED_FILE_NAME"
              );
              if (name && name.value) {
                createNewFileInRoot(name.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#NEW_FOLDER_ROOT":
            {
              const name = outParamsGot.find(
                (p) => p.paramKey === "#CREATED_FOLDER_NAME"
              );
              if (name && name.value) {
                createNewDirInRoot(name.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#NEW_FILE_INSIDE_DIRECTORY":
            {
              const dir = outParamsGot.find(
                (p) => p.paramKey === "#DIRECTORY_NAME"
              );
              const name = outParamsGot.find(
                (p) => p.paramKey === "#FILE_NAME"
              );

              if (name && name.value) {
                createFileInFolder(dir.value, name.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          case "#NEW_FOLDER_INSIDE_DIRECTORY":
            {
              const dir = outParamsGot.find(
                (p) => p.paramKey === "#DIRECTORY_NAME"
              );
              const name = outParamsGot.find(
                (p) => p.paramKey === "#FOLDER_NAME"
              );

              if (name && name.value) {
                createDirInFolder(dir.value, name.value);
              } else {
                console.warn("No se encontró parámetros completos");
              }
            }
            break;

          default:
            break;
        }

        updateSystemMessage(sysLoaderId, summaryResponse, status);

        if (currentStream) {
          currentStream.getTracks().forEach((t) => t.stop());
          currentStream = null;
        }

        recordBtn.textContent = "Grabar";
        recordBtn.classList.remove("recording");
        document.getElementById("voicePanel").classList.remove("recording");
      });
    } else {
      console.log("[Voice] stopping22");
      mediaRecorder.stop();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof initializeVoicePanel === "function") initializeVoicePanel();
});



// Utilidades para manejar los mensajes en el panel de voz
/**
 * Inserta un loader de sistema y devuelve su id para luego actualizarlo.
 * @returns {string} id del div que contiene el loader
 */


/**
 * Sustituye el loader por el mensaje final y le aplica status.
 * @param {string} id – id devuelto por addSystemMessageLoading
 * @param {string} text – texto a mostrar
 * @param {boolean|null} status – true: éxito (verde), false: error (rojo), null: neutral (gris)
 */



function getFormattedTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addUserMessageLoading() {
  const chatContent = document.getElementById("chatContent");
  const messageDiv = document.createElement("div");
  const messageId = `msg-${Date.now()}`;
  messageDiv.className = "chat-message user";
  messageDiv.id = messageId;
  messageDiv.innerHTML = `
    <video src="assets/loader_typing.mp4" class="loader" loop autoplay muted playsinline></video>
  `;
  chatContent.appendChild(messageDiv);
  chatContent.scrollTop = chatContent.scrollHeight;
  return messageId;
}

function updateUserMessage(id, text) {
  const messageDiv = document.getElementById(id);
  if (messageDiv) {
    messageDiv.innerHTML = `
      <span>${text}</span>
      <span class="chat-timestamp">${getFormattedTimestamp()}</span>
    `;
  }
}

function addSystemMessageLoading() {
  const chatContent = document.getElementById("chatContent");
  const messageDiv = document.createElement("div");
  const messageId = `sys-msg-${Date.now()}`;
  messageDiv.className = "chat-message system neutral";
  messageDiv.id = messageId;
  messageDiv.innerHTML = `
    <div class="siri-loader"></div>
  `;
  chatContent.appendChild(messageDiv);
  chatContent.scrollTop = chatContent.scrollHeight;
  return messageId;
}

function updateSystemMessage(id, text, status = null) {
  const messageDiv = document.getElementById(id);
  if (!messageDiv) return;

  messageDiv.classList.remove("true", "false", "neutral");
  const statusClass = status === true ? "true" : status === false ? "false" : "neutral";
  messageDiv.classList.add(statusClass);

  messageDiv.innerHTML = `
    <span>${text}</span>
    <span class="chat-timestamp">${getFormattedTimestamp()}</span>
  `;

  console.log(`[Chat] Mensaje actualizado: ${text} (status: ${statusClass})`);

  const chatContent = document.getElementById("chatContent");
  chatContent.scrollTop = chatContent.scrollHeight;
}
