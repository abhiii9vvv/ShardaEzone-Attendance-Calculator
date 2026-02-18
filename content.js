(() => {
  const TARGET_URL = "https://student.sharda.ac.in/admin/courses";
  const APPLIED_ATTR = "data-ezone-attendance";

  if (!location.href.startsWith(TARGET_URL)) {
    return;
  }

  const sourceTable = findSourceTable();
  if (!sourceTable || sourceTable.hasAttribute(APPLIED_ATTR)) {
    return;
  }

  const legacyTable = document.getElementById("ezone-attendance-calculated");
  if (legacyTable) {
    legacyTable.remove();
  }

  const targetControl = insertTargetControl(sourceTable);
  applyAttendanceColumns(sourceTable, getTarget());
  sourceTable.setAttribute(APPLIED_ATTR, "true");

  if (targetControl) {
    targetControl.addEventListener("change", () => {
      applyAttendanceColumns(sourceTable, getTarget());
    });
  }

  function getTarget() {
    const value = targetControl ? Number(targetControl.value) : 0.75;
    return Number.isFinite(value) ? value : 0.75;
  }

  function findSourceTable() {
    const tables = Array.from(document.querySelectorAll("table"));
    return tables.find((table) => {
      const headers = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.trim().toLowerCase());
      return headers.includes("course name") && headers.includes("course code") && headers.includes("percentage");
    });
  }

  function parseNumber(value) {
    const numeric = Number(String(value).replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function insertTargetControl(table) {
    const container = document.createElement("div");
    container.className = "ez-target-bar";
    container.innerHTML = `
      <div class="ez-target-inner">
        <span class="ez-table-tag">av9</span>
        <label class="ez-label" for="ez-target">Target</label>
        <select id="ez-target" class="ez-select">
          <option value="0.75">75%</option>
          <option value="0.85">85%</option>
        </select>
      </div>
    `;

    table.parentElement?.insertBefore(container, table);
    return container.querySelector("#ez-target");
  }

  function applyAttendanceColumns(table, target) {
    const headerRow = getDataHeaderRow(table);
    if (!headerRow) {
      return;
    }

    const baseHeaderCount = headerRow.querySelectorAll("th").length;
    const headerCells = Array.from(headerRow.querySelectorAll("th"));
    const columnMap = buildColumnMap(headerCells);
    const deliveredIndex = columnMap.delivered ?? 6;
    const attendedIndex = columnMap.attended ?? 7;

    const targetLabel = `${Math.round(target * 100)}%`;
    const canSkipIndex = ensureHeaderCell(headerRow, "can skip", `Can Skip (${targetLabel})`);
    const needAttendIndex = ensureHeaderCell(headerRow, "need to attend", `Need to Attend (${targetLabel})`);

    adjustHeaderColspans(table, baseHeaderCount, headerRow.querySelectorAll("th").length);

    const dataRows = Array.from(table.querySelectorAll("tbody tr"))
      .map((row) => Array.from(row.querySelectorAll("td")))
      .filter((cells) => cells.length >= 11);

    const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
    bodyRows.forEach((row) => {
      if (isTotalRow(row)) {
        normalizeTotalRow(row, baseHeaderCount, headerRow.querySelectorAll("th").length);
        return;
      }

      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length < 11) {
        normalizeRowCells(row, headerRow.querySelectorAll("th").length);
        return;
      }

      const delivered = parseNumber(cells[deliveredIndex]?.textContent);
      const attended = parseNumber(cells[attendedIndex]?.textContent);
      const canSkip = calculateCanSkip(attended, delivered, target);
      const needAttend = calculateNeedAttend(attended, delivered, target);

      ensureBodyCellAt(row, canSkipIndex, `<span class="ez-can-skip-value">${canSkip}</span>`);
      ensureBodyCellAt(row, needAttendIndex, `<span class="ez-need-attend-value">${needAttend}</span>`);
    });

    normalizeFooter(table, baseHeaderCount, headerRow.querySelectorAll("th").length);
  }


  function getDataHeaderRow(table) {
    const headerRows = Array.from(table.querySelectorAll("thead tr"));
    if (headerRows.length === 0) {
      return null;
    }
    const match = headerRows.find((row) => {
      const labels = Array.from(row.querySelectorAll("th")).map((cell) => cell.textContent.trim().toLowerCase());
      return labels.includes("course name") && labels.includes("course code");
    });
    return match || headerRows[headerRows.length - 1];
  }

  function buildColumnMap(headers) {
    let index = 0;
    const map = {};

    headers.forEach((cell) => {
      const text = cell.textContent.trim().toLowerCase();
      const span = Math.max(1, Number(cell.getAttribute("colspan")) || 1);

      if (text === "delivered") {
        map.delivered = index;
      } else if (text === "attended") {
        map.attended = index;
      }

      index += span;
    });

    return map;
  }

  function ensureHeaderCell(row, key, label) {
    const cells = Array.from(row.querySelectorAll("th"));
    const existing = cells.find((cell) => cell.textContent.trim().toLowerCase().startsWith(key));
    if (existing) {
      existing.textContent = label;
      return cells.indexOf(existing);
    }

    const th = document.createElement("th");
    th.textContent = label;
    row.appendChild(th);
    return row.querySelectorAll("th").length - 1;
  }

  function ensureBodyCellAt(row, index, html) {
    const cells = Array.from(row.querySelectorAll("td"));
    while (cells.length <= index) {
      const td = document.createElement("td");
      row.appendChild(td);
      cells.push(td);
    }
    cells[index].innerHTML = html;
  }

  function normalizeRowCells(row, headerCount) {
    const cells = row.querySelectorAll("td");
    const missing = headerCount - cells.length;
    if (missing <= 0) {
      return;
    }
    for (let i = 0; i < missing; i += 1) {
      const td = document.createElement("td");
      td.textContent = "";
      row.appendChild(td);
    }
  }

  function normalizeFooter(table, previousHeaderCount, currentHeaderCount) {
    const footerRow = table.querySelector("tfoot tr");
    if (!footerRow) {
      return;
    }
    const cells = Array.from(footerRow.querySelectorAll("td"));

    while (cells.length > 0) {
      const last = cells[cells.length - 1];
      const hasContent = last.textContent && last.textContent.trim().length > 0;
      if (hasContent || last.querySelector("strong, span, a")) {
        break;
      }
      last.remove();
      cells.pop();
    }

    const totalCols = cells.reduce((sum, cell) => {
      const span = Number(cell.getAttribute("colspan")) || 1;
      return sum + span;
    }, 0);

    const delta = currentHeaderCount - totalCols;
    if (delta > 0 && cells.length > 0) {
      const targetCell = cells.findLast((cell) => (cell.textContent || "").trim().length > 0) || cells[cells.length - 1];
      const currentSpan = Number(targetCell.getAttribute("colspan")) || 1;
      targetCell.setAttribute("colspan", String(currentSpan + delta));
    }
  }

  function isTotalRow(row) {
    const text = row.textContent ? row.textContent.trim().toLowerCase() : "";
    return text.includes("total") || row.querySelector("td[colspan]");
  }

  function normalizeTotalRow(row, previousHeaderCount, currentHeaderCount) {
    const delta = currentHeaderCount - previousHeaderCount;
    const cells = Array.from(row.querySelectorAll("td"));
    const spanCell = cells.find((cell) => Number(cell.getAttribute("colspan")) > 1) || cells[0];
    if (spanCell && delta > 0) {
      const currentSpan = Number(spanCell.getAttribute("colspan")) || 1;
      spanCell.setAttribute("colspan", String(currentSpan + delta));
    }

    while (cells.length > currentHeaderCount) {
      const cell = cells.pop();
      cell.remove();
    }
  }

  function adjustHeaderColspans(table, previousCount, nextCount) {
    if (nextCount <= previousCount) {
      return;
    }
    const delta = nextCount - previousCount;
    const headerRows = Array.from(table.querySelectorAll("thead tr"));
    headerRows.forEach((row) => {
      if (row.querySelectorAll("th").length === nextCount) {
        return;
      }
      const ths = Array.from(row.querySelectorAll("th"));
      const totalSpan = ths.reduce((sum, th) => sum + (Number(th.getAttribute("colspan")) || 1), 0);
      if (totalSpan === previousCount && ths.length > 0) {
        const last = ths[ths.length - 1];
        const current = Number(last.getAttribute("colspan")) || 1;
        last.setAttribute("colspan", String(current + delta));
      }
    });
  }


  function calculateCanSkip(attended, delivered, target) {
    if (!delivered || attended <= 0) {
      return "-";
    }
    const maxSkip = Math.floor(attended / target - delivered);
    return maxSkip > 0 ? String(maxSkip) : "0";
  }

  function calculateNeedAttend(attended, delivered, target) {
    if (!delivered && !attended) {
      return "-";
    }
    const current = delivered > 0 ? attended / delivered : 0;
    if (current >= target) {
      return "0";
    }
    const needed = Math.ceil((target * delivered - attended) / (1 - target));
    return needed > 0 ? String(needed) : "0";
  }
})();
