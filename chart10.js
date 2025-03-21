document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data_ggsheet.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        // Chuẩn hóa dữ liệu
        data.forEach(d => {
            d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
            d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1; // Lấy tháng (1-12)
            d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
            d["Mặt hàng"] = d["Tên mặt hàng"];
        });

        // Nhóm dữ liệu theo "Tháng", "Nhóm hàng" và "Mặt hàng", tính số đơn hàng duy nhất
        const donHangThang = d3.rollup(
            data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Tháng"],
            d => d["Nhóm hàng"],
            d => d["Mặt hàng"]
        );

        // Tính tổng số đơn hàng theo "Tháng" và "Nhóm hàng"
        const tongDonHang = d3.rollup(
            data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Tháng"],
            d => d["Nhóm hàng"]
        );

        // Chuyển thành mảng và tính xác suất mua
        const xacSuatThang = [];
        donHangThang.forEach((groupMap, thang) => {
            groupMap.forEach((itemMap, nhomHang) => {
                const totalOrders = tongDonHang.get(thang).get(nhomHang) || 1; // Tránh chia cho 0
                itemMap.forEach((count, matHang) => {
                    xacSuatThang.push({
                        "Tháng": thang,
                        "Nhóm hàng": nhomHang,
                        "Mặt hàng": matHang,
                        "Xác suất mua": (count / totalOrders) * 100 // Tính phần trăm
                    });
                });
            });
        });

        // Lấy danh sách nhóm hàng duy nhất (giới hạn 5 nhóm đầu tiên)
        const nhomHang = [...new Set(xacSuatThang.map(d => d["Nhóm hàng"]))].slice(0, 5);

        // **Tạo figure lớn**
        const svgWidth = 1200, svgHeight = 600;
        const margin = { top: 80, right: 80, bottom: 80, left: 80 };
        const width = (svgWidth - margin.left - margin.right) / 3 - 20; // Chia thành 3 cột
        const height = (svgHeight - margin.top - margin.bottom) / 2 - 20; // Chia thành 2 hàng

        const svg = d3.select("#chart10")
            .append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // **Thêm tiêu đề chính**
        svg.append("text")
            .attr("x", svgWidth / 2 - margin.left)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("font-size", "22px")
            .attr("font-weight", "bold")
            .attr("fill", "#337ab7")
            .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng trong từng Tháng");

        // Tạo màu sắc cho các đường
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Vẽ các biểu đồ trong figure lớn
        nhomHang.forEach((nhom, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const g = svg.append("g")
                .attr("transform", `translate(${col * (width + 40)}, ${row * (height + 60)})`);

            // Lọc dữ liệu cho nhóm hàng hiện tại
            const groupData = xacSuatThang.filter(d => d["Nhóm hàng"] === nhom);

            // Tạo tỷ lệ trục
            const xScale = d3.scaleLinear()
                .domain([1, 12])
                .range([0, width]);

            const yMax = nhom === "[BOT] Bột" ? 120 : d3.max(groupData, d => d["Xác suất mua"]) || 100;
            const yScale = d3.scaleLinear()
                .domain([0, yMax])
                .range([height, 0]);

            // Vẽ đường và điểm cho từng mặt hàng
            const matHangGroups = d3.group(groupData, d => d["Mặt hàng"]);
            matHangGroups.forEach((values, matHang) => {
                const line = d3.line()
                    .x(d => xScale(d["Tháng"]))
                    .y(d => yScale(d["Xác suất mua"]));

                g.append("path")
                    .datum(values)
                    .attr("class", "line")
                    .attr("d", line)
                    .style("stroke", colorScale(matHang))
                    .style("stroke-width", 2)
                    .style("fill", "none");

                // Thêm điểm (dots) trên đường
                g.selectAll(`.dot-${matHang.replace(/\s+/g, '-')}`)
                    .data(values)
                    .enter()
                    .append("circle")
                    .attr("class", "dot")
                    .attr("cx", d => xScale(d["Tháng"]))
                    .attr("cy", d => yScale(d["Xác suất mua"]))
                    .attr("r", 4)
                    .style("fill", colorScale(matHang));
            });

            // Thêm trục X và Y
            g.append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(xScale).ticks(12).tickFormat(d => `T${d}`));

            g.append("g")
                .call(d3.axisLeft(yScale).tickFormat(d => `${d.toFixed(1)}%`));

            // Thêm tiêu đề nhóm hàng
            g.append("text")
                .attr("x", width / 2)
                .attr("y", -15)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .text(nhom);
        });

    }).catch(error => {
        console.error("Lỗi tải dữ liệu:", error);
    });
});
