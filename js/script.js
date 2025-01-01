document.getElementById("monthlyReport").addEventListener("change", function () {
  document.getElementById("singleMonthInput").style.display = "block";
  document.getElementById("multiMonthInput").style.display = "none";
});

document.getElementById("multiMonthReport").addEventListener("change", function () {
  document.getElementById("singleMonthInput").style.display = "none";
  document.getElementById("multiMonthInput").style.display = "block";
});

document.getElementById("generateReport").addEventListener("click", function () {
  // اضافه کردن انیمیشن لودینگ
  const loadingOverlay = document.createElement("div");
  loadingOverlay.className = "loading-overlay";
  const loadingSpinner = document.createElement("div");
  loadingSpinner.className = "loading-spinner";
  loadingOverlay.appendChild(loadingSpinner);
  document.body.appendChild(loadingOverlay);
  document.body.classList.add("loading");

  const reportType = document.querySelector('input[name="reportType"]:checked').value;
  const formContainer = document.getElementById("formContainer");
  const reportContainer = document.getElementById("reportContainer");
  const reportSummary = document.getElementById("reportSummary");
  const reportSection = document.getElementById("reportSection");
  const totalTasksContainer = document.createElement("div");
  const totalTasksElement = document.createElement("p");
  totalTasksElement.className = "total-tasks";
  const totalTimeSpentElement = document.createElement("p");
  totalTimeSpentElement.className = "total-time-spent";

  totalTasksContainer.appendChild(totalTasksElement);
  totalTasksContainer.appendChild(totalTimeSpentElement);

  const reportTablesContainer = document.createElement("div");
  reportTablesContainer.className = "report-tables-container";

  let fileNames = [];

  if (reportType === "monthly") {
    const year = document.getElementById("year").value;
    const month = document.getElementById("month").value;
    fileNames.push(`${year}${month}.xlsx`);
  } else if (reportType === "multi-month") {
    const startYear = document.getElementById("startYear").value;
    const startMonth = document.getElementById("startMonth").value;
    const endYear = document.getElementById("endYear").value;
    const endMonth = document.getElementById("endMonth").value;

    let currentYear = parseInt(startYear);
    let currentMonth = parseInt(startMonth);

    while (
      currentYear < parseInt(endYear) ||
      (currentYear === parseInt(endYear) && currentMonth <= parseInt(endMonth))
    ) {
      fileNames.push(`${currentYear}${currentMonth.toString().padStart(2, "0")}.xlsx`);
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
  }

  Promise.all(
    fileNames.map((fileName) => {
      const filePath = `xls/${fileName}`;
      return fetch(filePath)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Network response was not ok ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then((data) => XLSX.read(data, { type: "array" }));
    })
  )
    .then((workbooks) => {
      let allData = [];
      let taskSubjects = [];
      let totalTasks = 0;
      let totalTimeSpent = 0; // جمع زمان‌های صرف شده
      let unitTimeSpent = {};
      let taskTypeCount = Array(8).fill(0); // برای 8 نوع تسک

      workbooks.forEach((workbook) => {
        const sheetNames = ["Report(A)", "Report(K)"];
        const chartsSheetName = "Charts";

        // استخراج داده‌ها از شیت Charts
        const chartsSheet = workbook.Sheets[chartsSheetName];
        if (chartsSheet) {
          for (let i = 0; i < 8; i++) {
            const cellAddress = `D${42 + i}`;
            const cellValue = chartsSheet[cellAddress] ? chartsSheet[cellAddress].v : 0;
            taskTypeCount[i] += cellValue;
          }
        }

        sheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // استخراج موضوعات تسک از سطر اول اکسل
          if (taskSubjects.length === 0 && jsonData.length > 0) {
            taskSubjects = jsonData[0].slice(5, 13);
          }

          jsonData.forEach((row, index) => {
            if (index !== 0 && row[1]) {
              // رد شدن از ردیف عنوان‌ها و بررسی پر بودن ستون 1
              allData.push(row);
              totalTasks++; // شمارش تعداد کل تسک‌ها
              const timeSpent = parseFloat(row[13]) || 0; // زمان صرف شده در تسک
              totalTimeSpent += timeSpent; // جمع کردن زمان صرف شده
              const unit = row[3]; // واحد

              if (unit) {
                // اطمینان حاصل کردن که واحد مقدار صحیح دارد
                if (!unitTimeSpent[unit]) {
                  unitTimeSpent[unit] = 0;
                }
                unitTimeSpent[unit] += timeSpent;
              }
            }
          });
        });
      });

      // ساخت گزارش به صورت جدول

      // جدول نوع تسک و تعداد استفاده شده
      let taskReport = `<div class="report-table">
                          <h3>گزارش تعداد تسک‌ها بر اساس نوع</h3>
                          <table border="1">
                              <thead>
                                  <tr><th>نوع تسک</th><th>تعداد استفاده شده</th></tr>
                              </thead>
                              <tbody>`;
      taskSubjects.forEach((subject, index) => {
        taskReport += `<tr><td>${subject}</td><td>${taskTypeCount[index]}</td></tr>`;
      });
      taskReport += `   </tbody>
                      </table>
                    </div>`;

      // جدول زمان صرف شده بر اساس واحد
      let timeReport = `<div class="report-table">
                          <h3>زمان صرف شده بر اساس واحد</h3>
                          <table border="1">
                              <thead>
                                  <tr><th>واحد</th><th>زمان صرف شده (دقیقه)</th></tr>
                              </thead>
                              <tbody>`;
      for (const unit in unitTimeSpent) {
        if (unitTimeSpent.hasOwnProperty(unit)) {
          timeReport += `<tr><td>${unit}</td><td>${unitTimeSpent[unit]}</td></tr>`;
        }
      }
      timeReport += `   </tbody>
                      </table>
                    </div>`;

      // نمایش تعداد کل تسک‌ها و جمع زمان‌های صرف شده
      totalTasksElement.textContent = `تعداد کل تسک‌ها: ${totalTasks}`;
      totalTimeSpentElement.textContent = `مجموع زمان صرف شده: ${totalTimeSpent} دقیقه`;
      reportSummary.innerHTML = "";
      reportSummary.appendChild(totalTasksContainer);
      reportTablesContainer.innerHTML = taskReport + timeReport;
      reportSection.innerHTML = "";
      reportSection.appendChild(reportTablesContainer);

      // حذف انیمیشن لودینگ پس از پایان کار
      document.body.removeChild(loadingOverlay);
      document.body.classList.remove("loading");
      reportContainer.style.display = "block";
    })
    .catch((error) => {
      console.error("Error:", error);
      formContainer.innerHTML = `<p>خطا در بارگذاری داده‌ها. لطفا دوباره تلاش کنید.</p>`;
      document.body.removeChild(loadingOverlay);
      document.body.classList.remove("loading");
    });
});
