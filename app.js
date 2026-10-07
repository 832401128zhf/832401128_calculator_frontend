const API_BASE_URL = "http://localhost:8080/api";

const expressionInput = document.getElementById("expression");
const resultElement = document.getElementById("result");
const messageElement = document.getElementById("message");
const historyList = document.getElementById("historyList");
const calculateButton = document.getElementById("calculateButton");
const clearButton = document.getElementById("clearButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const serverStatus = document.getElementById("serverStatus");

function setMessage(message = "") {
    messageElement.textContent = message;
}

function setServerStatus(online) {
    serverStatus.textContent = online ? "后端已连接" : "后端未连接";
    serverStatus.className = online
        ? "status status-online"
        : "status status-offline";
}

function appendToExpression(value) {
    expressionInput.value += value;
    expressionInput.focus();
    setMessage();
}

document.querySelectorAll("[data-value]").forEach((button) => {
    button.addEventListener("click", () => appendToExpression(button.dataset.value));
});

clearButton.addEventListener("click", () => {
    expressionInput.value = "";
    resultElement.textContent = "0";
    setMessage();
    expressionInput.focus();
});

calculateButton.addEventListener("click", calculate);

expressionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        calculate();
    }
});

async function calculate() {
    const expression = expressionInput.value.trim();
    if (!expression) {
        setMessage("请输入表达式");
        return;
    }

    setMessage("正在由后端计算...");
    calculateButton.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/calculate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ expression })
        });

        const data = await readJsonSafely(response);
        if (!response.ok) {
            throw new Error(data?.error || "计算失败");
        }

        resultElement.textContent = data.result;
        setMessage();
        setServerStatus(true);
        await loadHistory();
    } catch (error) {
        setServerStatus(false);
        setMessage(error.message === "Failed to fetch"
            ? "无法连接后端，请确认 Spring Boot 已在 8080 端口运行"
            : error.message);
    } finally {
        calculateButton.disabled = false;
    }
}

async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/history`);
        const data = await readJsonSafely(response);
        if (!response.ok) {
            throw new Error(data?.error || "加载历史记录失败");
        }

        setServerStatus(true);
        renderHistory(data);
    } catch (error) {
        setServerStatus(false);
        historyList.innerHTML = `<div class="empty-state">无法读取历史记录，请先启动后端</div>`;
    }
}

function renderHistory(records) {
    if (!records.length) {
        historyList.innerHTML = `<div class="empty-state">暂无计算历史</div>`;
        return;
    }

    historyList.innerHTML = records.map((record) => `
        <article class="history-item">
            <div>
                <div class="history-expression">${escapeHtml(record.expression)}</div>
                <div class="history-result">= ${escapeHtml(record.result)}</div>
                <div class="history-time">${formatTime(record.createdAt)}</div>
            </div>
            <button class="delete-button" data-id="${record.id}">删除</button>
        </article>
    `).join("");

    document.querySelectorAll(".delete-button").forEach((button) => {
        button.addEventListener("click", () => deleteHistory(button.dataset.id));
    });
}

async function deleteHistory(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/history/${id}`, {
            method: "DELETE"
        });
        if (!response.ok) {
            const data = await readJsonSafely(response);
            throw new Error(data?.error || "删除失败");
        }
        await loadHistory();
    } catch (error) {
        setMessage(error.message);
    }
}

clearHistoryButton.addEventListener("click", async () => {
    if (!window.confirm("确定要清空全部历史记录吗？")) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/history`, {
            method: "DELETE"
        });
        if (!response.ok) {
            const data = await readJsonSafely(response);
            throw new Error(data?.error || "清空失败");
        }
        await loadHistory();
    } catch (error) {
        setMessage(error.message);
    }
});

function formatTime(isoText) {
    const date = new Date(isoText);
    if (Number.isNaN(date.getTime())) {
        return isoText;
    }
    return date.toLocaleString("zh-CN", { hour12: false });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function readJsonSafely(response) {
    const text = await response.text();
    if (!text) {
        return null;
    }
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

loadHistory();
