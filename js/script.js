document.getElementById('generateReport').addEventListener('click', function() {
    const year = document.getElementById('year').value; // دریافت سال وارد شده
    const month = document.getElementById('month').value; // دریافت ماه انتخاب شده
    const mainContainer = document.getElementById('mainContainer');
    const reportSection = document.getElementById('reportSection');
    const totalTasksContainer = document.createElement('div');
    totalTasksContainer.className = 'total-tasks-container';
    const totalTasksElement = document.createElement('p');
    totalTasksElement.className = 'total-tasks';
    totalTasksContainer.appendChild(totalTasksElement);

    const reportTablesContainer = document.createElement('div');
    reportTablesContainer.className = 'report-tables-container';

    // ساخت نام فایل بر اساس سال و ماه
    const fileName = `${year}${month}.xlsx`;

    // آدرس فایل اکسل در پوشه `excel`
    const filePath = `xls/${fileName}`;

    // بارگذاری فایل اکسل با استفاده از Fetch API
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok ${response.statusText}`);
            }
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });

            // نام شیت‌های دو کارمند
            const sheetNames = ['Report(A)', 'Report(K)'];
            const chartsSheetName = 'Charts';

            let allData = [];
            let taskSubjects = [];
            let totalTasks = 0;
            let unitTimeSpent = {};
            let taskTypeCount = Array(8).fill(0); // برای 8 نوع تسک

            // استخراج داده‌ها از شیت Charts
            const chartsSheet = workbook.Sheets[chartsSheetName];
            if (chartsSheet) {
                for (let i = 0; i < 8; i++) {
                    const cellAddress = `D${42 + i}`;
                    const cellValue = chartsSheet[cellAddress] ? chartsSheet[cellAddress].v : 0;
                    taskTypeCount[i] = cellValue;
                }
            } else {
                throw new Error(`Sheet ${chartsSheetName} not found`);
            }

            sheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // استخراج موضوعات تسک از سطر اول اکسل
                if (taskSubjects.length === 0 && jsonData.length > 0) {
                    taskSubjects = jsonData[0].slice(5, 13);
                }

                jsonData.forEach((row, index) => {
                    if (index !== 0 && row[1]) { // رد شدن از ردیف عنوان‌ها و بررسی پر بودن ستون 1
                        allData.push(row);
                        totalTasks++; // شمارش تعداد کل تسک‌ها

                        const timeSpent = parseFloat(row[13]) || 0; // زمان صرف شده در تسک
                        const unit = row[3]; // واحد

                        if (unit) { // اطمینان حاصل کردن که واحد مقدار صحیح دارد
                            if (!unitTimeSpent[unit]) {
                                unitTimeSpent[unit] = 0;
                            }
                            unitTimeSpent[unit] += timeSpent;
                        }
                    }
                });
            });

            // انیمیشن برای تمام صفحه شدن
            mainContainer.classList.add('fullscreen');

            // ساخت گزارش به صورت جدول

            // جدول نوع تسک و تعداد استفاده شده
            let taskReport = `<div class="report-table">
                                <h3>گزارش تعداد تسک‌ها بر اساس نوع:</h3>
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
                                <h3>زمان صرف شده بر اساس واحد:</h3>
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

            // نمایش تعداد کل تسک‌ها و گزارش‌ها
            totalTasksElement.textContent = `تعداد کل تسک‌ها: ${totalTasks}`;
            reportSection.innerHTML = '';
            reportSection.appendChild(totalTasksContainer);
            reportTablesContainer.innerHTML = taskReport + timeReport;
            reportSection.appendChild(reportTablesContainer);
        })
        .catch(error => {
            console.error('Error loading the Excel file:', error);
            reportSection.innerHTML = `<p>خطا در بارگذاری فایل اکسل: ${error.message}</p>`;
        });
});
