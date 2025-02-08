// تعویض بین حالت ماهانه و چند ماهه
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('input[name="reportType"]').forEach((elem) => {
    elem.addEventListener("change", function () {
      const isMonthly = this.value === "monthly";
      document.getElementById("singleMonthInput").style.display = isMonthly
        ? "block"
        : "none";
      document.getElementById("multiMonthInput").style.display = isMonthly
        ? "none"
        : "block";
    });
  });
});

// نمایش لودر
const showLoading = () => {
  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "loading-overlay";
  const loadingSpinner = document.createElement("div");
  loadingSpinner.className = "loading-spinner";
  loadingOverlay.appendChild(loadingSpinner);
  document.body.appendChild(loadingOverlay);
  document.body.classList.add("loading");
};

// پنهان کردن لودر
const hideLoading = () => {
  const loadingOverlay = document.querySelector(".loading-overlay");
  if (loadingOverlay) {
    document.body.removeChild(loadingOverlay);
    document.body.classList.remove("loading");
  }
};

// نمایش ارور به صورت پاپ‌آپ
const showErrorPopup = (message) => {
  const errorPopup = document.createElement("div");
  errorPopup.className = "error-popup";
  errorPopup.textContent = message;
  document.body.appendChild(errorPopup);

  setTimeout(() => {
    errorPopup.classList.add("show");
    setTimeout(() => {
      errorPopup.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(errorPopup);
      }, 300);
    }, 3000); // زمان نمایش پاپ‌آپ به میلی‌ثانیه
  }, 100);
};
//انیمیشن شمارش اعداد
const animateRandomNumber = (element, end, duration) => {
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= duration) {
      clearInterval(interval);
      element.textContent = end;
    } else {
      const randomValue = Math.floor(Math.random() * (end + 100)); // شروع تصادفی از عددی بزرگتر از صفر
      element.textContent = randomValue;
    }
  }, 50); // هر 50 میلی‌ثانیه یک عدد تصادفی نمایش داده می‌شود
};

const animateAllRandomNumbers = () => {
  document.querySelectorAll(".animated-number").forEach((element) => {
    const endValue = parseInt(element.getAttribute("data-end-value"), 10);
    if (!isNaN(endValue)) {
      animateRandomNumber(element, endValue, 1500); // 1500 میلی‌ثانیه زمان انیمیشن
    }
  });
};

// ساخت فرم اینپوت در فرم گزارش
const createInputForm = (year, month) => {
  return `
    <div class="form-group">
      <input type="text" id="reportYear" name="year" placeholder=" " value="${year}" required />
      <label for="reportYear">سال را وارد کنید</label>
    </div>
    <div class="form-group">
      <div class="select-wrapper">
        <select id="reportMonth" name="month" required>
          <option value="" disabled ${!month ? "selected" : ""}></option>
          ${[
            "فروردین",
            "اردیبهشت",
            "خرداد",
            "تیر",
            "مرداد",
            "شهریور",
            "مهر",
            "آبان",
            "آذر",
            "دی",
            "بهمن",
            "اسفند",
          ]
            .map(
              (m, i) =>
                `<option value="${(i + 1).toString().padStart(2, "0")}" ${
                  month === (i + 1).toString().padStart(2, "0")
                    ? "selected"
                    : ""
                }>${m}</option>`
            )
            .join("")}
        </select>
        <label for="reportMonth">ماه را انتخاب کنید</label>
      </div>
    </div>
  `;
};

// آپدیت فرم
const updateInputForm = (year, month) => {
  const inputFormContainer = document.createElement("div");
  inputFormContainer.id = "inputFormContainer";
  inputFormContainer.innerHTML = createInputForm(year, month);

  const updateButton = document.createElement("button");
  updateButton.id = "updateReportBtn";
  updateButton.textContent = "به‌روزرسانی گزارش";
  updateButton.addEventListener("click", function () {
    const newYear = document.getElementById("reportYear").value;
    const newMonth = document.getElementById("reportMonth").value;
    generateReport(newYear, newMonth);
  });

  const formContainer = document.createElement("div");
  formContainer.id = "formContainer";
  formContainer.appendChild(inputFormContainer);

  const reportSection = document.getElementById("reportSection");
  reportSection.appendChild(formContainer);
};
const generateReport = async (
  year,
  month,
  startYear,
  startMonth,
  endYear,
  endMonth
) => {
  showLoading();

  try {
    const reportType = document.querySelector(
      'input[name="reportType"]:checked'
    ).value;
    const reportContainer = document.getElementById("reportContainer");
    const reportSection = document.getElementById("reportSection");

    let fileNames = [];

    if (reportType === "monthly") {
      if (!year || !month) {
        console.error("Year or month input is missing.");
        hideLoading();
        return;
      }
      fileNames.push(`${year}${month}.xlsx`);
    } else {
      if (!startYear || !startMonth || !endYear || !endMonth) {
        console.error("Start or end year/month input is missing.");
        hideLoading();
        return;
      }
      let currentYear = parseInt(startYear);
      let currentMonth = parseInt(startMonth);
      while (
        currentYear < parseInt(endYear) ||
        (currentYear === parseInt(endYear) &&
          currentMonth <= parseInt(endMonth))
      ) {
        fileNames.push(
          `${currentYear}${currentMonth.toString().padStart(2, "0")}.xlsx`
        );
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }
    }

    // گرفتن اطلاعات از اکسل و نام فایل و نام شیت ها
    const fetchOptions = {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    };

    const workbooks = await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = `xls/${fileName}?t=${new Date().getTime()}`;
        const response = await fetch(filePath, fetchOptions);
        if (!response.ok)
          throw new Error(`Network response was not ok ${response.statusText}`);
        const data = await response.arrayBuffer();
        return XLSX.read(data, { type: "array" });
      })
    );

    let allData = [];
    let taskSubjects = [];
    let totalTasks = 0;
    let totalTimeSpent = 0;
    let unitTimeSpent = {};
    let taskTypeCount = Array(10).fill(0);

    workbooks.forEach((workbook) => {
      const sheetNames = ["Report(A)", "Report(K)"];
      const chartsSheetName = "Charts";

      const chartsSheet = workbook.Sheets[chartsSheetName];
      if (chartsSheet) {
        for (let i = 0; i < 10; i++) {
          const cellAddress = `D${42 + i}`;
          const cellValue = chartsSheet[cellAddress]
            ? chartsSheet[cellAddress].v
            : 0;
          taskTypeCount[i] += cellValue;
        }
      }

      sheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (taskSubjects.length === 0 && jsonData.length > 0) {
          taskSubjects = jsonData[0].slice(5, 15);
        }

        jsonData.forEach((row, index) => {
          if (index !== 0 && row[1]) {
            allData.push(row);
            totalTasks++;
            const timeSpent = parseFloat(row[15]) || 0;
            totalTimeSpent += timeSpent;
            const unit = row[3];

            if (unit) {
              if (!unitTimeSpent[unit]) {
                unitTimeSpent[unit] = 0;
              }
              unitTimeSpent[unit] += timeSpent;
            }
          }
        });
      });
    });

    // بررسی و تعریف متغیرهای زمان صرف شده
    let totalHours = 0;
    let remainingMinutes = 0;
    let timeSpentText = `${totalTimeSpent} دقیقه`;

    if (totalTimeSpent > 100) {
      totalHours = Math.floor(totalTimeSpent / 60);
      remainingMinutes = totalTimeSpent % 60;
      timeSpentText = `${totalHours} ساعت و ${remainingMinutes} دقیقه`;
    }

    const taskReport = `
      <div class="report-table">
        <table border="1">
          <thead>
            <tr><th colspan="2" class="headTable">گزارش تعداد تسک‌ها بر اساس نوع</th></tr>
            <tr><th>نوع تسک</th><th>تعداد استفاده شده</th></tr>
          </thead>
          <tbody>
            ${taskSubjects
              .map(
                (subject, index) =>
                  `<tr><td>${subject}</td><td class="animated-number" data-end-value="${taskTypeCount[index]}">0</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
    const timeReport = `
      <div class="report-table">
        <table border="1">
          <thead>
            <tr><th colspan="2" class="headTable">زمان صرف شده بر اساس واحد</th></tr>
            <tr><th>واحد</th><th>زمان صرف شده (دقیقه)</th></tr>
          </thead>
          <tbody>
            ${Object.keys(unitTimeSpent)
              .map(
                (unit) =>
                  `<tr><td>${unit}</td><td class="animated-number" data-end-value="${unitTimeSpent[unit]}">0</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    const totalTasksContainer = document.createElement("div");
    totalTasksContainer.className = "total-tasks-container";
    if (totalTimeSpent > 100) {
      totalTasksContainer.innerHTML = `
    <p class="total-tasks">تعداد کل تسک‌ها: <span class="animated-number number-wrapper" data-end-value="${totalTasks}">0</span></p>
    <p class="total-time-spent">مجموع زمان صرف شده: 
      <span class="animated-number time-wrapper" data-end-value="${totalHours}">0</span> ساعت و 
      <span class="animated-number time-wrapper" data-end-value="${remainingMinutes}">0</span> دقیقه
    </p>
  `;
    } else {
      totalTasksContainer.innerHTML = `
    <p class="total-tasks">تعداد کل تسک‌ها: <span class="animated-number number-wrapper" data-end-value="${totalTasks}">0</span></p>
    <p class="total-time-spent">مجموع زمان صرف شده: <span class="animated-number time-wrapper" data-end-value="${totalTimeSpent}">0</span> دقیقه</p>
  `;
    }

    const reportSummary = document.createElement("div");
    reportSummary.className = "report-summary";
    reportSummary.appendChild(totalTasksContainer);

    const inputFormContainer = document.createElement("div");
    inputFormContainer.className = "input-form-container";
    inputFormContainer.innerHTML = createInputForm(year, month);

    const updateButton = document.createElement("button");
    updateButton.id = "updateReportBtn";
    updateButton.textContent = "به‌روزرسانی گزارش";
    updateButton.addEventListener("click", function () {
      const newYear = document.getElementById("reportYear").value;
      const newMonth = document.getElementById("reportMonth").value;
      generateReport(newYear, newMonth);
    });
    inputFormContainer.appendChild(updateButton);
    inputFormContainer.appendChild(createPrintButton());

    reportSection.innerHTML = "";
    reportSection.appendChild(inputFormContainer);
    reportSection.appendChild(reportSummary);

    const reportTablesContainer = document.createElement("div");
    reportTablesContainer.className = "report-tables-container";
    reportTablesContainer.innerHTML = taskReport + timeReport;
    reportSection.appendChild(reportTablesContainer);

    document
      .getElementById("printReportBtn")
      .addEventListener("click", printReport);
    hideLoading();
    reportContainer.style.display = "block";
    document.getElementById("formContainer").style.display = "none"; // پنهان کردن فرم اولیه
    //اضافه کردن انیمیشن
    animateAllRandomNumbers();
  } catch (error) {
    console.error("Error:", error);
    showErrorPopup(`خطا در بارگذاری لطفا دوباره تلاش کنید`);
    hideLoading();
  }
};
// ساخت محتوی پرینت گزارش
const generatePrintContent = (
  year,
  month,
  startYear,
  startMonth,
  endYear,
  endMonth,
  totalTasks,
  totalTimeSpent,
  taskReport,
  timeReport
) => {
  let reportTitle = "";
  if (startYear && startMonth && endYear && endMonth) {
    reportTitle = `گزارش از ${startMonth} / ${startYear} تا ${endMonth} / ${endYear}`;
  } else {
    reportTitle = `${month} / ${year}`;
  }

  return `
    <div>
      <h1>${reportTitle}</h1>
      <div class="summery">
        <p>${totalTasks}</p>
        <p>${totalTimeSpent}</p>
      </div>
      <div class="report_Container">
        <div class="task_report">${taskReport}</div>
        <div class="time_report">${timeReport}</div>
      </div>
    </div>
  `;
};

// چاپ گزارش
const printReport = () => {
  const year = document.getElementById("reportYear").value;
  const month = document.getElementById("reportMonth").value;
  const startYear = document.getElementById("startYear")
    ? document.getElementById("startYear").value
    : null;
  const startMonth = document.getElementById("startMonth")
    ? document.getElementById("startMonth").value
    : null;
  const endYear = document.getElementById("endYear")
    ? document.getElementById("endYear").value
    : null;
  const endMonth = document.getElementById("endMonth")
    ? document.getElementById("endMonth").value
    : null;

  const totalTasks = document.querySelector(".total-tasks").textContent;
  const totalTimeSpent =
    document.querySelector(".total-time-spent").textContent;
  const taskReport = document.querySelector(
    ".report-table:nth-of-type(1)"
  ).outerHTML;
  const timeReport = document.querySelector(
    ".report-table:nth-of-type(2)"
  ).outerHTML;

  const printContent = generatePrintContent(
    year,
    month,
    startYear,
    startMonth,
    endYear,
    endMonth,
    totalTasks,
    totalTimeSpent,
    taskReport,
    timeReport
  );

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
      <title>پرینت گزارش</title>
        <style>
          body { font-family: B Yekan; direction: rtl; text-align: right; }
          .report-table { margin-top: 20px; display:flex; flex-direction: column; align-items: center;}
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 0.8rem;}
          th { background-color: #f2f2f2; }
          .summery{display: flex; justify-content: space-around;}
          .report_Container{display: flex; justify-content: space-around; align-items: flex-start;}
          .task_report , .time_report{width: 40%}
        </style>
      </head>
      <body>${printContent}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

// ساخت دکمه پرینت
const createPrintButton = () => {
  const printButton = document.createElement("button");
  printButton.id = "printReportBtn";
  printButton.textContent = "پرینت گزارش";
  printButton.addEventListener("click", printReport);
  return printButton;
};

// ایجاد گزارش
document
  .getElementById("generateReport")
  .addEventListener("click", function () {
    const reportType = document.querySelector(
      'input[name="reportType"]:checked'
    ).value;

    if (reportType === "monthly") {
      const year = document.getElementById("year").value;
      const month = document.getElementById("month").value;
      generateReport(year, month);
    } else {
      const startYear = document.getElementById("startYear").value;
      const startMonth = document.getElementById("startMonth").value;
      const endYear = document.getElementById("endYear").value;
      const endMonth = document.getElementById("endMonth").value;
      generateReport(startYear, startMonth, endYear, endMonth);
    }
  });
