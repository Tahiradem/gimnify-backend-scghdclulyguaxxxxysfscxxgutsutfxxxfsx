function adjustColumnWidths() {
    const table = document.getElementById("dynamicTable");
    const headers = table.querySelectorAll("th");
    const columns = Array.from(headers).map(() => 0);
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        cells.forEach((cell, index) => {
            columns[index] = Math.max(columns[index], cell.scrollWidth);
        });
    });

    columns.forEach((width, index) => {
        headers[index].style.width = `${width + 20}px`;
    });
}

function dashboard_display_btn() {
    if (localStorage.getItem('boolForDashboard') === 'true') {
        document.querySelector(".no_chart_display").style.display = 'none';
        document.querySelector(".dashboardDataAnalys").style.opacity = '1000%';
        localStorage.setItem('boolForDashboard', false);
        document.querySelector("#hide_btn").className = 'fa fa-eye-slash';
    } else {
        document.querySelector(".no_chart_display").style.display = 'flex';
        document.querySelector(".dashboardDataAnalys").style.opacity = '0%';
        localStorage.setItem('boolForDashboard', true);
        document.querySelector("#hide_btn").className = 'fa fa-eye';
    }
}

function Distroy_editing_box() {
    document.querySelector(".editing_box").style.display = 'none';
}

// Clean up charts before unloading
window.addEventListener('beforeunload', () => {
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
});

// Initialize when page loads
window.onload = () => {
    fetchData();
    loadSearchTerm();
    
    // Set up periodic updates
    setInterval(countCheckedUnchecked, 3000);
    setInterval(() => fetchData(), 300000);
};