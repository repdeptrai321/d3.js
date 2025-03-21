document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        // **Chuyển dữ liệu thành số**
        data.forEach(d => {
            d["Thành tiền"] = +d["Thành tiền"];
        });

        // **Tính tổng chi tiêu của mỗi khách hàng**
        const chiTieuKhachHang = d3.rollup(
            data,
            v => d3.sum(v, d => d["Thành tiền"]),
            d => d["Mã khách hàng"]
        );

        // **Chuyển dữ liệu về mảng**
        const chiTieuArray = Array.from(chiTieuKhachHang.values());

        // **Tạo nhóm bin (0-50K, 50K-100K,... tới 4M)**
        const binRanges = d3.range(0, 4100000, 50000);
        const bins = d3.bin()
            .domain([0, 4000000])
            .thresholds(binRanges)
            (chiTieuArray);

        // **Lọc bỏ nhóm có số khách = 0**
        const filteredBins = bins.filter(d => d.length > 0);

        // **Tạo kích thước tự động để hiển thị đủ**
        const width = Math.max(1000, filteredBins.length * 20);
        const height = 500;
        const margin = { top: 60, right: 50, bottom: 120, left: 80 };

        // **Tạo SVG**
        const svg = d3.select("#chart12")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // **Tạo scale**
        const xScale = d3.scaleBand()
            .domain(filteredBins.map(d => `${d.x0 / 1000000}-${d.x1 / 1000000}M`)) // Hiển thị đơn vị triệu
            .range([0, width - margin.left - margin.right])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredBins, d => d.length) * 1.1])
            .nice()
            .range([height - margin.top - margin.bottom, 0]);

        // **Vẽ cột**
        svg.selectAll(".bar")
            .data(filteredBins)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(`${d.x0 / 1000000}-${d.x1 / 1000000}M`))
            .attr("y", d => yScale(d.length))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - margin.top - margin.bottom - yScale(d.length))
            .attr("fill", "#007bff")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("fill", "#0056b3"); // Đổi màu khi hover
                tooltip.style("display", "block")
                    .html(`
                        <strong>Khoảng:</strong> ${d.x0.toLocaleString()} - ${d.x1.toLocaleString()} <br>
                        <strong>Số khách:</strong> ${d.length}
                    `)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 30}px`);
            })
            .on("mouseout", function () {
                d3.select(this).attr("fill", "#007bff"); // Trả lại màu gốc
                tooltip.style("display", "none");
            });


        // **Thêm trục Y**
        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(10));

        // **Thêm nhãn trục**
        svg.append("text")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", height - margin.bottom + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "#333")
            .text("Khoảng chi tiêu của khách hàng (Triệu VND)");

        svg.append("text")
            .attr("x", -(height - margin.top - margin.bottom) / 2)
            .attr("y", -50)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "#333")
            .text("Số lượng khách hàng");

        // **Thêm tiêu đề chính**
        svg.append("text")
            .attr("x", (width - margin.left - margin.right) / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", "#007bff")
            .text("Phân phối Mức chi trả của Khách hàng");

        // **Thêm tooltip**
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("font-size", "12px")
            .style("display", "none");

    }).catch(error => {
        console.error("Error loading CSV:", error);
    });
});
