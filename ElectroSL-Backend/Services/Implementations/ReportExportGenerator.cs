using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using ClosedXML.Excel;
using ElectroSL_Backend.DTOs.Admin;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ElectroSL_Backend.Services.Implementations;

public static class ReportExportGenerator
{
    static ReportExportGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        QuestPDF.Settings.ThrowOnMissingFontFamilies = false;
    }

    public static string GetRangeLabel(string range, DateTime? customFrom, DateTime? customTo)
    {
        if (range.Equals("custom", StringComparison.OrdinalIgnoreCase) || customFrom.HasValue || customTo.HasValue)
        {
            var fromStr = customFrom?.ToString("yyyy-MM-dd") ?? "Beginning";
            var toStr = customTo?.ToString("yyyy-MM-dd") ?? "Today";
            return $"Custom Range ({fromStr} to {toStr})";
        }

        return range.ToLowerInvariant() switch
        {
            "7d" => "Last 7 Days",
            "30d" => "Last 30 Days",
            "90d" => "Last 90 Days",
            "this_year" => "This Year",
            "all" => "All Time",
            _ => range
        };
    }

    // =========================================================================
    // 1. FINANCIAL SUMMARY EXPORT
    // =========================================================================

    public static byte[] GenerateFinancialCsv(AdminDashboardAnalyticsDto analytics, string rangeLabel)
    {
        var sb = new StringBuilder();
        sb.Append('\uFEFF'); // UTF-8 BOM
        sb.AppendLine("ElectroSL Executive Financial Summary Report");
        sb.AppendLine($"Generated At (UTC),{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"Selected Date Range,{EscapeCsv(rangeLabel)}");
        sb.AppendLine();
        sb.AppendLine("Financial Metric,Amount (LKR),Description");
        sb.AppendLine($"Gross Merchandise Value (GMV),{analytics.TotalGmv:F2},Total authoritative job volume including equipment");
        sb.AppendLine($"Platform Commission (15%),{analytics.PlatformCommission:F2},ElectroSL authoritative 15% platform fee");
        sb.AppendLine($"FullDigital Online Collections,{analytics.FullDigitalOnlineCollections:F2},100% online gateway collections");
        sb.AppendLine($"CashSplit Online Collections,{analytics.CashSplitOnlineCollections:F2},15% platform commission collected online for cash jobs");
        sb.AppendLine($"Direct Cash Paid to Electricians,{analytics.DirectCashPaidToElectricians:F2},85% settled directly on-site with customer");
        sb.AppendLine($"Electrician Earnings (85%),{analytics.ElectricianEarnings:F2},Technician net compensation");
        sb.AppendLine($"Outstanding Wallet Liability,{analytics.OutstandingWalletLiability:F2},Current liability owed to technicians across active balances");
        sb.AppendLine($"Total Recorded Payouts,{analytics.TotalRecordedPayouts:F2},Total disbursed bank transfers");
        sb.AppendLine($"Payment Transactions Count,{analytics.PaymentTransactionCount},Completed payment transaction records");
        sb.AppendLine();
        sb.AppendLine("Financial Trends Over Time");
        sb.AppendLine("Period,GMV (LKR),Commission (LKR),Electrician Earnings (LKR),Transaction Count");
        foreach (var p in analytics.FinancialTrends)
        {
            sb.AppendLine($"{EscapeCsv(p.Period)},{p.Gmv:F2},{p.Commission:F2},{p.ElectricianEarnings:F2},{p.TransactionCount}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public static byte[] GenerateFinancialXlsx(AdminDashboardAnalyticsDto analytics, string rangeLabel)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Financial Summary");

        // Title & Metadata
        ws.Cell("A1").Value = "ElectroSL Executive Financial Summary Report";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 16;
        ws.Cell("A1").Style.Font.FontColor = XLColor.FromHtml("#0F172A");

        ws.Cell("A2").Value = $"Generated At (UTC): {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} | Selected Range: {rangeLabel}";
        ws.Cell("A2").Style.Font.Italic = true;
        ws.Cell("A2").Style.Font.FontColor = XLColor.FromHtml("#64748B");

        // KPI Summary Table
        ws.Cell("A4").Value = "Executive Financial Key Performance Indicators";
        ws.Cell("A4").Style.Font.Bold = true;
        ws.Cell("A4").Style.Font.FontSize = 13;

        string[] kpiHeaders = { "Financial Metric", "Amount (LKR)", "Description" };
        for (int i = 0; i < kpiHeaders.Length; i++)
        {
            var cell = ws.Cell(5, i + 1);
            cell.Value = kpiHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = i == 1 ? XLAlignmentHorizontalValues.Right : XLAlignmentHorizontalValues.Left;
        }

        var kpis = new (string Metric, decimal Amount, string Description)[]
        {
            ("Gross Merchandise Value (GMV)", analytics.TotalGmv, "Total authoritative job volume including equipment"),
            ("Platform Commission (15%)", analytics.PlatformCommission, "ElectroSL authoritative 15% platform fee"),
            ("FullDigital Online Collections", analytics.FullDigitalOnlineCollections, "100% online gateway collections"),
            ("CashSplit Online Collections", analytics.CashSplitOnlineCollections, "15% platform commission collected online for cash jobs"),
            ("Direct Cash Paid to Electricians", analytics.DirectCashPaidToElectricians, "85% settled directly on-site with customer"),
            ("Electrician Earnings (85%)", analytics.ElectricianEarnings, "Technician net compensation"),
            ("Outstanding Wallet Liability", analytics.OutstandingWalletLiability, "Current liability owed to technicians across active balances"),
            ("Total Recorded Payouts", analytics.TotalRecordedPayouts, "Total disbursed bank transfers"),
            ("Payment Transactions Count", analytics.PaymentTransactionCount, "Completed payment transaction records")
        };

        int row = 6;
        foreach (var item in kpis)
        {
            ws.Cell(row, 1).Value = item.Metric;
            var amtCell = ws.Cell(row, 2);
            amtCell.Value = item.Amount;
            amtCell.Style.NumberFormat.Format = "#,##0.00";
            amtCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
            ws.Cell(row, 3).Value = item.Description;

            if (row % 2 == 1)
            {
                ws.Range(row, 1, row, 3).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            }
            row++;
        }

        // Trends Table
        row += 2;
        ws.Cell(row, 1).Value = "Financial Trends Over Time";
        ws.Cell(row, 1).Style.Font.Bold = true;
        ws.Cell(row, 1).Style.Font.FontSize = 13;
        row++;

        string[] trendHeaders = { "Period", "GMV (LKR)", "Commission (LKR)", "Electrician Earnings (LKR)", "Transactions" };
        for (int i = 0; i < trendHeaders.Length; i++)
        {
            var cell = ws.Cell(row, i + 1);
            cell.Value = trendHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = i > 0 ? XLAlignmentHorizontalValues.Right : XLAlignmentHorizontalValues.Left;
        }
        row++;

        int trendStartRow = row;
        foreach (var t in analytics.FinancialTrends)
        {
            ws.Cell(row, 1).Value = t.Period;

            var cGmv = ws.Cell(row, 2);
            cGmv.Value = t.Gmv;
            cGmv.Style.NumberFormat.Format = "#,##0.00";

            var cComm = ws.Cell(row, 3);
            cComm.Value = t.Commission;
            cComm.Style.NumberFormat.Format = "#,##0.00";

            var cEarn = ws.Cell(row, 4);
            cEarn.Value = t.ElectricianEarnings;
            cEarn.Style.NumberFormat.Format = "#,##0.00";

            var cCount = ws.Cell(row, 5);
            cCount.Value = t.TransactionCount;
            cCount.Style.NumberFormat.Format = "#,##0";

            if (row % 2 == 1)
            {
                ws.Range(row, 1, row, 5).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            }
            row++;
        }

        if (analytics.FinancialTrends.Any())
        {
            ws.Cell(row, 1).Value = "Total";
            ws.Cell(row, 1).Style.Font.Bold = true;

            var tGmv = ws.Cell(row, 2);
            tGmv.FormulaA1 = $"SUM(B{trendStartRow}:B{row - 1})";
            tGmv.Style.Font.Bold = true;
            tGmv.Style.NumberFormat.Format = "#,##0.00";

            var tComm = ws.Cell(row, 3);
            tComm.FormulaA1 = $"SUM(C{trendStartRow}:C{row - 1})";
            tComm.Style.Font.Bold = true;
            tComm.Style.NumberFormat.Format = "#,##0.00";

            var tEarn = ws.Cell(row, 4);
            tEarn.FormulaA1 = $"SUM(D{trendStartRow}:D{row - 1})";
            tEarn.Style.Font.Bold = true;
            tEarn.Style.NumberFormat.Format = "#,##0.00";

            var tCount = ws.Cell(row, 5);
            tCount.FormulaA1 = $"SUM(E{trendStartRow}:E{row - 1})";
            tCount.Style.Font.Bold = true;
            tCount.Style.NumberFormat.Format = "#,##0";

            ws.Range(row, 1, row, 5).Style.Border.TopBorder = XLBorderStyleValues.Thin;
            ws.Range(row, 1, row, 5).Style.Border.BottomBorder = XLBorderStyleValues.Double;
        }

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public static byte[] GenerateFinancialPdf(AdminDashboardAnalyticsDto analytics, string rangeLabel)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Lato"));

                page.Header().Element(header => ComposeHeader(header, "Executive Financial Summary Report", rangeLabel));

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Spacing(12);

                    // Section 1: KPI Cards Grid
                    col.Item().Text("Authoritative Financial Key Performance Indicators").FontSize(11).Bold().FontColor("#0F172A");

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(4);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#1E293B").Padding(5).Text("Financial Metric").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(5).AlignRight().Text("Amount (LKR)").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(5).Text("Description").Bold().FontColor(Colors.White);
                        });

                        var kpis = new (string Metric, decimal Amount, string Description)[]
                        {
                            ("Gross Merchandise Value (GMV)", analytics.TotalGmv, "Total authoritative job volume including equipment"),
                            ("Platform Commission (15%)", analytics.PlatformCommission, "ElectroSL authoritative 15% platform fee"),
                            ("FullDigital Online Collections", analytics.FullDigitalOnlineCollections, "100% online gateway collections"),
                            ("CashSplit Online Collections", analytics.CashSplitOnlineCollections, "15% platform fee collected online for cash jobs"),
                            ("Direct Cash Paid to Electricians", analytics.DirectCashPaidToElectricians, "85% settled directly on-site with customer"),
                            ("Electrician Earnings (85%)", analytics.ElectricianEarnings, "Technician net compensation"),
                            ("Outstanding Wallet Liability", analytics.OutstandingWalletLiability, "Active liability owed across electrician balances"),
                            ("Total Recorded Payouts", analytics.TotalRecordedPayouts, "Total disbursed bank transfers"),
                            ("Payment Transactions Count", analytics.PaymentTransactionCount, "Total completed payment transactions")
                        };

                        int idx = 0;
                        foreach (var item in kpis)
                        {
                            string bg = idx % 2 == 1 ? "#F8FAFC" : "#FFFFFF";
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).Text(item.Metric).SemiBold();
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text(item.Amount.ToString("N2")).Bold();
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).Text(item.Description).FontColor("#64748B");
                            idx++;
                        }
                    });

                    // Section 2: Trends Table
                    col.Item().Text("Financial Volume Trends").FontSize(11).Bold().FontColor("#0F172A");

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(1);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#2563EB").Padding(5).Text("Period").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(5).AlignRight().Text("GMV (LKR)").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(5).AlignRight().Text("Commission (LKR)").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(5).AlignRight().Text("Earnings (LKR)").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(5).AlignRight().Text("Txs").Bold().FontColor(Colors.White);
                        });

                        int tIdx = 0;
                        foreach (var t in analytics.FinancialTrends)
                        {
                            string bg = tIdx % 2 == 1 ? "#F8FAFC" : "#FFFFFF";
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).Text(t.Period);
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text(t.Gmv.ToString("N2"));
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text(t.Commission.ToString("N2"));
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text(t.ElectricianEarnings.ToString("N2"));
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text(t.TransactionCount.ToString());
                            tIdx++;
                        }

                        if (!analytics.FinancialTrends.Any())
                        {
                            table.Cell().ColumnSpan(5).Padding(8).AlignCenter().Text("No financial transactions recorded in the selected period.").Italic().FontColor("#64748B");
                        }
                    });
                });

                page.Footer().Element(ComposeFooter);
            });
        }).GeneratePdf();
    }

    // =========================================================================
    // 2. JOB OPERATIONS EXPORT
    // =========================================================================

    public static byte[] GenerateJobsCsv(AdminDashboardAnalyticsDto analytics, string rangeLabel)
    {
        var sb = new StringBuilder();
        sb.Append('\uFEFF');
        sb.AppendLine("ElectroSL Job Operations Report");
        sb.AppendLine($"Generated At (UTC),{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"Selected Date Range,{EscapeCsv(rangeLabel)}");
        sb.AppendLine();
        sb.AppendLine("Job Status,Count,Percentage");
        int total = analytics.JobStatuses.Total;
        sb.AppendLine($"Pending,{analytics.JobStatuses.Pending},{(total > 0 ? (analytics.JobStatuses.Pending * 100.0 / total):0):F1}%");
        sb.AppendLine($"Assigned,{analytics.JobStatuses.Assigned},{(total > 0 ? (analytics.JobStatuses.Assigned * 100.0 / total):0):F1}%");
        sb.AppendLine($"In Progress,{analytics.JobStatuses.InProgress},{(total > 0 ? (analytics.JobStatuses.InProgress * 100.0 / total):0):F1}%");
        sb.AppendLine($"Completed,{analytics.JobStatuses.Completed},{(total > 0 ? (analytics.JobStatuses.Completed * 100.0 / total):0):F1}%");
        sb.AppendLine($"Cancelled,{analytics.JobStatuses.Cancelled},{(total > 0 ? (analytics.JobStatuses.Cancelled * 100.0 / total):0):F1}%");
        sb.AppendLine($"Disputed,{analytics.JobStatuses.Disputed},{(total > 0 ? (analytics.JobStatuses.Disputed * 100.0 / total):0):F1}%");
        sb.AppendLine($"Total Jobs,{total},100.0%");
        sb.AppendLine();
        sb.AppendLine("Operational Job Volume Trends");
        sb.AppendLine("Period,Created Count,Completed Count");
        foreach (var jt in analytics.JobTrends)
        {
            sb.AppendLine($"{EscapeCsv(jt.Period)},{jt.CreatedCount},{jt.CompletedCount}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public static byte[] GenerateJobsXlsx(AdminDashboardAnalyticsDto analytics, string rangeLabel)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Job Operations");

        ws.Cell("A1").Value = "ElectroSL Job Operations & Telemetry Report";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 16;
        ws.Cell("A1").Style.Font.FontColor = XLColor.FromHtml("#0F172A");

        ws.Cell("A2").Value = $"Generated At (UTC): {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} | Selected Range: {rangeLabel}";
        ws.Cell("A2").Style.Font.Italic = true;
        ws.Cell("A2").Style.Font.FontColor = XLColor.FromHtml("#64748B");

        ws.Cell("A4").Value = "Job Lifecycle Status Distribution";
        ws.Cell("A4").Style.Font.Bold = true;
        ws.Cell("A4").Style.Font.FontSize = 13;

        string[] headers = { "Job Status", "Count", "Percentage (%)" };
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(5, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = i > 0 ? XLAlignmentHorizontalValues.Right : XLAlignmentHorizontalValues.Left;
        }

        int total = analytics.JobStatuses.Total;
        var statuses = new (string Status, int Count)[]
        {
            ("Pending", analytics.JobStatuses.Pending),
            ("Assigned", analytics.JobStatuses.Assigned),
            ("In Progress", analytics.JobStatuses.InProgress),
            ("Completed", analytics.JobStatuses.Completed),
            ("Cancelled", analytics.JobStatuses.Cancelled),
            ("Disputed", analytics.JobStatuses.Disputed)
        };

        int row = 6;
        foreach (var s in statuses)
        {
            ws.Cell(row, 1).Value = s.Status;
            ws.Cell(row, 2).Value = s.Count;
            ws.Cell(row, 2).Style.NumberFormat.Format = "#,##0";

            var pctCell = ws.Cell(row, 3);
            pctCell.Value = total > 0 ? (decimal)s.Count / total : 0m;
            pctCell.Style.NumberFormat.Format = "0.0%";

            if (row % 2 == 1) ws.Range(row, 1, row, 3).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            row++;
        }

        ws.Cell(row, 1).Value = "Total Jobs";
        ws.Cell(row, 1).Style.Font.Bold = true;
        ws.Cell(row, 2).Value = total;
        ws.Cell(row, 2).Style.Font.Bold = true;
        ws.Cell(row, 2).Style.NumberFormat.Format = "#,##0";
        ws.Cell(row, 3).Value = total > 0 ? 1.0m : 0.0m;
        ws.Cell(row, 3).Style.Font.Bold = true;
        ws.Cell(row, 3).Style.NumberFormat.Format = "0.0%";
        ws.Range(row, 1, row, 3).Style.Border.TopBorder = XLBorderStyleValues.Thin;
        ws.Range(row, 1, row, 3).Style.Border.BottomBorder = XLBorderStyleValues.Double;

        row += 2;
        ws.Cell(row, 1).Value = "Job Creation & Completion Trends";
        ws.Cell(row, 1).Style.Font.Bold = true;
        ws.Cell(row, 1).Style.Font.FontSize = 13;
        row++;

        string[] tHeaders = { "Period", "Created Count", "Completed Count" };
        for (int i = 0; i < tHeaders.Length; i++)
        {
            var cell = ws.Cell(row, i + 1);
            cell.Value = tHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = i > 0 ? XLAlignmentHorizontalValues.Right : XLAlignmentHorizontalValues.Left;
        }
        row++;

        foreach (var jt in analytics.JobTrends)
        {
            ws.Cell(row, 1).Value = jt.Period;
            ws.Cell(row, 2).Value = jt.CreatedCount;
            ws.Cell(row, 2).Style.NumberFormat.Format = "#,##0";
            ws.Cell(row, 3).Value = jt.CompletedCount;
            ws.Cell(row, 3).Style.NumberFormat.Format = "#,##0";

            if (row % 2 == 1) ws.Range(row, 1, row, 3).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            row++;
        }

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public static byte[] GenerateJobsPdf(AdminDashboardAnalyticsDto analytics, string rangeLabel)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Lato"));

                page.Header().Element(header => ComposeHeader(header, "Job Operations & Dispatch Report", rangeLabel));

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Text("Job Lifecycle Status Distribution").FontSize(11).Bold().FontColor("#0F172A");

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#1E293B").Padding(5).Text("Job Status").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(5).AlignRight().Text("Count").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(5).AlignRight().Text("Share (%)").Bold().FontColor(Colors.White);
                        });

                        int total = analytics.JobStatuses.Total;
                        var statuses = new (string Status, int Count)[]
                        {
                            ("Pending", analytics.JobStatuses.Pending),
                            ("Assigned", analytics.JobStatuses.Assigned),
                            ("In Progress", analytics.JobStatuses.InProgress),
                            ("Completed", analytics.JobStatuses.Completed),
                            ("Cancelled", analytics.JobStatuses.Cancelled),
                            ("Disputed", analytics.JobStatuses.Disputed)
                        };

                        int idx = 0;
                        foreach (var s in statuses)
                        {
                            string bg = idx % 2 == 1 ? "#F8FAFC" : "#FFFFFF";
                            double pct = total > 0 ? (s.Count * 100.0 / total) : 0.0;
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).Text(s.Status).SemiBold();
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text(s.Count.ToString("N0")).Bold();
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text($"{pct:F1}%");
                            idx++;
                        }

                        table.Cell().Background("#E2E8F0").Padding(4).Text("Total Jobs").Bold();
                        table.Cell().Background("#E2E8F0").Padding(4).AlignRight().Text(total.ToString("N0")).Bold();
                        table.Cell().Background("#E2E8F0").Padding(4).AlignRight().Text("100.0%").Bold();
                    });

                    col.Item().Text("Job Volume Velocity Trends").FontSize(11).Bold().FontColor("#0F172A");

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#2563EB").Padding(5).Text("Period").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(5).AlignRight().Text("Created Count").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(5).AlignRight().Text("Completed Count").Bold().FontColor(Colors.White);
                        });

                        int tIdx = 0;
                        foreach (var jt in analytics.JobTrends)
                        {
                            string bg = tIdx % 2 == 1 ? "#F8FAFC" : "#FFFFFF";
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).Text(jt.Period);
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text(jt.CreatedCount.ToString());
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text(jt.CompletedCount.ToString());
                            tIdx++;
                        }

                        if (!analytics.JobTrends.Any())
                        {
                            table.Cell().ColumnSpan(3).Padding(8).AlignCenter().Text("No job volume velocity trends in this period.").Italic().FontColor("#64748B");
                        }
                    });
                });

                page.Footer().Element(ComposeFooter);
            });
        }).GeneratePdf();
    }

    // =========================================================================
    // 3. TECHNICIAN WORKFORCE EXPORT
    // =========================================================================

    public static byte[] GenerateTechniciansCsv(AdminDashboardAnalyticsDto analytics, string rangeLabel)
    {
        var sb = new StringBuilder();
        sb.Append('\uFEFF');
        sb.AppendLine("ElectroSL Technician Workforce Report");
        sb.AppendLine($"Generated At (UTC),{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"Selected Date Range,{EscapeCsv(rangeLabel)}");
        sb.AppendLine();
        sb.AppendLine("Accreditation Status,Count,Percentage");
        int total = analytics.TechnicianStats.Total;
        sb.AppendLine($"Approved Technicians,{analytics.TechnicianStats.Approved},{(total > 0 ? (analytics.TechnicianStats.Approved * 100.0 / total):0):F1}%");
        sb.AppendLine($"Pending Verifications,{analytics.TechnicianStats.Pending},{(total > 0 ? (analytics.TechnicianStats.Pending * 100.0 / total):0):F1}%");
        sb.AppendLine($"Rejected Applications,{analytics.TechnicianStats.Rejected},{(total > 0 ? (analytics.TechnicianStats.Rejected * 100.0 / total):0):F1}%");
        sb.AppendLine($"Suspended / Inactive,{analytics.TechnicianStats.SuspendedOrInactive},{(total > 0 ? (analytics.TechnicianStats.SuspendedOrInactive * 100.0 / total):0):F1}%");
        sb.AppendLine($"Total Registered Technicians,{total},100.0%");

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public static byte[] GenerateTechniciansXlsx(AdminDashboardAnalyticsDto analytics, string rangeLabel)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Technician Workforce");

        ws.Cell("A1").Value = "ElectroSL Technician Workforce & Accreditation Report";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 16;
        ws.Cell("A1").Style.Font.FontColor = XLColor.FromHtml("#0F172A");

        ws.Cell("A2").Value = $"Generated At (UTC): {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} | Selected Range: {rangeLabel}";
        ws.Cell("A2").Style.Font.Italic = true;
        ws.Cell("A2").Style.Font.FontColor = XLColor.FromHtml("#64748B");

        ws.Cell("A4").Value = "Technician Accreditation Status Distribution";
        ws.Cell("A4").Style.Font.Bold = true;
        ws.Cell("A4").Style.Font.FontSize = 13;

        string[] headers = { "Accreditation Status", "Technician Count", "Share (%)" };
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(5, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = i > 0 ? XLAlignmentHorizontalValues.Right : XLAlignmentHorizontalValues.Left;
        }

        int total = analytics.TechnicianStats.Total;
        var stats = new (string Status, int Count)[]
        {
            ("Approved Technicians", analytics.TechnicianStats.Approved),
            ("Pending Verifications", analytics.TechnicianStats.Pending),
            ("Rejected Applications", analytics.TechnicianStats.Rejected),
            ("Suspended / Inactive", analytics.TechnicianStats.SuspendedOrInactive)
        };

        int row = 6;
        foreach (var s in stats)
        {
            ws.Cell(row, 1).Value = s.Status;
            ws.Cell(row, 2).Value = s.Count;
            ws.Cell(row, 2).Style.NumberFormat.Format = "#,##0";

            var pctCell = ws.Cell(row, 3);
            pctCell.Value = total > 0 ? (decimal)s.Count / total : 0m;
            pctCell.Style.NumberFormat.Format = "0.0%";

            if (row % 2 == 1) ws.Range(row, 1, row, 3).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            row++;
        }

        ws.Cell(row, 1).Value = "Total Registered Technicians";
        ws.Cell(row, 1).Style.Font.Bold = true;
        ws.Cell(row, 2).Value = total;
        ws.Cell(row, 2).Style.Font.Bold = true;
        ws.Cell(row, 2).Style.NumberFormat.Format = "#,##0";
        ws.Cell(row, 3).Value = total > 0 ? 1.0m : 0.0m;
        ws.Cell(row, 3).Style.Font.Bold = true;
        ws.Cell(row, 3).Style.NumberFormat.Format = "0.0%";
        ws.Range(row, 1, row, 3).Style.Border.TopBorder = XLBorderStyleValues.Thin;
        ws.Range(row, 1, row, 3).Style.Border.BottomBorder = XLBorderStyleValues.Double;

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public static byte[] GenerateTechniciansPdf(AdminDashboardAnalyticsDto analytics, string rangeLabel)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Lato"));

                page.Header().Element(header => ComposeHeader(header, "Technician Workforce & Accreditation Report", rangeLabel));

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Text("Technician Accreditation Breakdown").FontSize(11).Bold().FontColor("#0F172A");

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#1E293B").Padding(5).Text("Status").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(5).AlignRight().Text("Count").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(5).AlignRight().Text("Share (%)").Bold().FontColor(Colors.White);
                        });

                        int total = analytics.TechnicianStats.Total;
                        var stats = new (string Status, int Count)[]
                        {
                            ("Approved Technicians", analytics.TechnicianStats.Approved),
                            ("Pending Verifications", analytics.TechnicianStats.Pending),
                            ("Rejected Applications", analytics.TechnicianStats.Rejected),
                            ("Suspended / Inactive", analytics.TechnicianStats.SuspendedOrInactive)
                        };

                        int idx = 0;
                        foreach (var s in stats)
                        {
                            string bg = idx % 2 == 1 ? "#F8FAFC" : "#FFFFFF";
                            double pct = total > 0 ? (s.Count * 100.0 / total) : 0.0;
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).Text(s.Status).SemiBold();
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text(s.Count.ToString("N0")).Bold();
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(4).AlignRight().Text($"{pct:F1}%");
                            idx++;
                        }

                        table.Cell().Background("#E2E8F0").Padding(4).Text("Total Registered Technicians").Bold();
                        table.Cell().Background("#E2E8F0").Padding(4).AlignRight().Text(total.ToString("N0")).Bold();
                        table.Cell().Background("#E2E8F0").Padding(4).AlignRight().Text("100.0%").Bold();
                    });
                });

                page.Footer().Element(ComposeFooter);
            });
        }).GeneratePdf();
    }

    // =========================================================================
    // 4. EQUIPMENT CATALOG & CLAIMS EXPORT
    // =========================================================================

    public static byte[] GenerateEquipmentCsv(List<CatalogItemDto> catalog, List<FlaggedClaimItemDto> claims)
    {
        var sb = new StringBuilder();
        sb.Append('\uFEFF');
        sb.AppendLine("ElectroSL Equipment Catalog & Price Claims Report");
        sb.AppendLine($"Generated At (UTC),{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine();
        sb.AppendLine("Equipment Catalog Benchmarks");
        sb.AppendLine("Catalog Item ID,Name,Category,Standard Market Price (LKR),Unit,Active Status");
        foreach (var item in catalog)
        {
            sb.AppendLine($"{item.ItemId},{EscapeCsv(item.ItemName)},{EscapeCsv(item.Category)},{item.StandardMarketPrice:F2},{EscapeCsv(item.Unit)},{(item.IsActive ? "Active" : "Inactive")}");
        }
        sb.AppendLine();
        sb.AppendLine("Flagged Equipment Price Claims");
        sb.AppendLine("Claim ID,Job ID,Item Name,Claimed Price (LKR),Standard Market Price (LKR),Status");
        foreach (var c in claims)
        {
            sb.AppendLine($"{c.Id},{c.JobId},{EscapeCsv(c.ItemName)},{c.ClaimedPrice:F2},{c.StandardMarketPrice:F2},{EscapeCsv(c.Status)}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public static byte[] GenerateEquipmentXlsx(List<CatalogItemDto> catalog, List<FlaggedClaimItemDto> claims)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Equipment Catalog & Claims");

        ws.Cell("A1").Value = "ElectroSL Equipment Catalog & Price Claims Report";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 16;
        ws.Cell("A1").Style.Font.FontColor = XLColor.FromHtml("#0F172A");

        ws.Cell("A2").Value = $"Generated At (UTC): {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}";
        ws.Cell("A2").Style.Font.Italic = true;
        ws.Cell("A2").Style.Font.FontColor = XLColor.FromHtml("#64748B");

        ws.Cell("A4").Value = "Equipment Standard Market Catalog Benchmarks";
        ws.Cell("A4").Style.Font.Bold = true;
        ws.Cell("A4").Style.Font.FontSize = 13;

        string[] catHeaders = { "Item ID", "Item Name", "Category", "Brand", "Standard Market Price (LKR)", "Unit", "Active Status" };
        for (int i = 0; i < catHeaders.Length; i++)
        {
            var cell = ws.Cell(5, i + 1);
            cell.Value = catHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = i == 4 ? XLAlignmentHorizontalValues.Right : XLAlignmentHorizontalValues.Left;
        }

        int row = 6;
        foreach (var item in catalog)
        {
            ws.Cell(row, 1).Value = item.ItemId;
            ws.Cell(row, 2).Value = item.ItemName;
            ws.Cell(row, 3).Value = item.Category;
            ws.Cell(row, 4).Value = item.BrandName;

            var pCell = ws.Cell(row, 5);
            pCell.Value = item.StandardMarketPrice;
            pCell.Style.NumberFormat.Format = "#,##0.00";

            ws.Cell(row, 6).Value = item.Unit;
            ws.Cell(row, 7).Value = item.IsActive ? "Active" : "Inactive";

            if (row % 2 == 1) ws.Range(row, 1, row, 7).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            row++;
        }

        row += 2;
        ws.Cell(row, 1).Value = "Flagged Equipment Price Claims";
        ws.Cell(row, 1).Style.Font.Bold = true;
        ws.Cell(row, 1).Style.Font.FontSize = 13;
        row++;

        string[] claimHeaders = { "Claim ID", "Job ID", "Item Name", "Category", "Claimed Price (LKR)", "Standard Market Price (LKR)", "Status" };
        for (int i = 0; i < claimHeaders.Length; i++)
        {
            var cell = ws.Cell(row, i + 1);
            cell.Value = claimHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = (i == 4 || i == 5) ? XLAlignmentHorizontalValues.Right : XLAlignmentHorizontalValues.Left;
        }
        row++;

        foreach (var c in claims)
        {
            ws.Cell(row, 1).Value = c.Id;
            ws.Cell(row, 2).Value = c.JobId;
            ws.Cell(row, 3).Value = c.ItemName;
            ws.Cell(row, 4).Value = c.Category;

            var clPrice = ws.Cell(row, 5);
            clPrice.Value = c.ClaimedPrice;
            clPrice.Style.NumberFormat.Format = "#,##0.00";

            var bmPrice = ws.Cell(row, 6);
            bmPrice.Value = c.StandardMarketPrice;
            bmPrice.Style.NumberFormat.Format = "#,##0.00";

            ws.Cell(row, 7).Value = c.Status;

            if (row % 2 == 1) ws.Range(row, 1, row, 7).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            row++;
        }

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public static byte[] GenerateEquipmentPdf(List<CatalogItemDto> catalog, List<FlaggedClaimItemDto> claims)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Lato"));

                page.Header().Element(header => ComposeHeader(header, "Equipment Catalog & Claims Report", "Enterprise Catalog"));

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Text("Equipment Price Catalog Benchmarks").FontSize(11).Bold().FontColor("#0F172A");

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(3);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(1);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#1E293B").Padding(4).Text("ID").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(4).Text("Item Name").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(4).Text("Category").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(4).AlignRight().Text("Benchmark (LKR)").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(4).AlignCenter().Text("Status").Bold().FontColor(Colors.White);
                        });

                        int idx = 0;
                        foreach (var item in catalog.Take(25))
                        {
                            string bg = idx % 2 == 1 ? "#F8FAFC" : "#FFFFFF";
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(item.ItemId.ToString());
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(item.ItemName).SemiBold();
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(item.Category);
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).AlignRight().Text(item.StandardMarketPrice.ToString("N2")).Bold();
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).AlignCenter().Text(item.IsActive ? "Active" : "Inactive");
                            idx++;
                        }
                    });

                    col.Item().Text("Flagged Equipment Price Claims").FontSize(11).Bold().FontColor("#0F172A");

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(3);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#2563EB").Padding(4).Text("Claim").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(4).Text("Job").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(4).Text("Item Name").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(4).AlignRight().Text("Claimed (LKR)").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(4).AlignRight().Text("Standard (LKR)").Bold().FontColor(Colors.White);
                            h.Cell().Background("#2563EB").Padding(4).AlignCenter().Text("Status").Bold().FontColor(Colors.White);
                        });

                        int cIdx = 0;
                        foreach (var c in claims.Take(25))
                        {
                            string bg = cIdx % 2 == 1 ? "#F8FAFC" : "#FFFFFF";
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(c.Id.ToString());
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(c.JobId.ToString());
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(c.ItemName);
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).AlignRight().Text(c.ClaimedPrice.ToString("N2"));
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).AlignRight().Text(c.StandardMarketPrice.ToString("N2"));
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).AlignCenter().Text(c.Status);
                            cIdx++;
                        }

                        if (!claims.Any())
                        {
                            table.Cell().ColumnSpan(6).Padding(8).AlignCenter().Text("No flagged price claims recorded.").Italic().FontColor("#64748B");
                        }
                    });
                });

                page.Footer().Element(ComposeFooter);
            });
        }).GeneratePdf();
    }

    // =========================================================================
    // 5. ADMINISTRATIVE AUDIT ACTIVITY EXPORT
    // =========================================================================

    public static byte[] GenerateAuditsCsv(List<AdminAuditLogDto> audits, string rangeLabel)
    {
        var sb = new StringBuilder();
        sb.Append('\uFEFF');
        sb.AppendLine("ElectroSL Administrative Audit Activity Report");
        sb.AppendLine($"Generated At (UTC),{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
        sb.AppendLine($"Selected Date Range,{EscapeCsv(rangeLabel)}");
        sb.AppendLine();
        sb.AppendLine("Audit ID,Admin User ID,Action Type,Entity Type,Entity ID,Description,Timestamp (UTC)");
        foreach (var a in audits)
        {
            sb.AppendLine($"{a.AuditLogId},{a.AdminUserId},{EscapeCsv(a.ActionType)},{EscapeCsv(a.EntityType)},{EscapeCsv(a.EntityId ?? string.Empty)},{EscapeCsv(a.Description)},{a.CreatedAtUtc:yyyy-MM-dd HH:mm:ss}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public static byte[] GenerateAuditsXlsx(List<AdminAuditLogDto> audits, string rangeLabel)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Administrative Audits");

        ws.Cell("A1").Value = "ElectroSL Unified Administrative Audit Trail";
        ws.Cell("A1").Style.Font.Bold = true;
        ws.Cell("A1").Style.Font.FontSize = 16;
        ws.Cell("A1").Style.Font.FontColor = XLColor.FromHtml("#0F172A");

        ws.Cell("A2").Value = $"Generated At (UTC): {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} | Selected Range: {rangeLabel}";
        ws.Cell("A2").Style.Font.Italic = true;
        ws.Cell("A2").Style.Font.FontColor = XLColor.FromHtml("#64748B");

        ws.Cell("A4").Value = "Administrative Events Register";
        ws.Cell("A4").Style.Font.Bold = true;
        ws.Cell("A4").Style.Font.FontSize = 13;

        string[] headers = { "Audit ID", "Admin User ID", "Admin Email", "Action Type", "Entity Type", "Entity ID", "Description", "Timestamp (UTC)" };
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(5, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");
            cell.Style.Font.FontColor = XLColor.White;
        }

        int row = 6;
        foreach (var a in audits)
        {
            ws.Cell(row, 1).Value = a.AuditLogId;
            ws.Cell(row, 2).Value = a.AdminUserId;
            ws.Cell(row, 3).Value = a.AdminEmail;
            ws.Cell(row, 4).Value = a.ActionType;
            ws.Cell(row, 5).Value = a.EntityType;
            ws.Cell(row, 6).Value = a.EntityId ?? string.Empty;
            ws.Cell(row, 7).Value = a.Description;

            var dCell = ws.Cell(row, 8);
            dCell.Value = a.CreatedAtUtc.ToString("yyyy-MM-dd HH:mm:ss");

            if (row % 2 == 1) ws.Range(row, 1, row, 8).Style.Fill.BackgroundColor = XLColor.FromHtml("#F8FAFC");
            row++;
        }

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    public static byte[] GenerateAuditsPdf(List<AdminAuditLogDto> audits, string rangeLabel)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Lato"));

                page.Header().Element(header => ComposeHeader(header, "Administrative Audit Activity Report", rangeLabel));

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Text("Administrative Event Log Records").FontSize(11).Bold().FontColor("#0F172A");

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(4);
                            cols.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#1E293B").Padding(4).Text("ID").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(4).Text("Action").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(4).Text("Entity").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(4).Text("Entity ID").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(4).Text("Description").Bold().FontColor(Colors.White);
                            h.Cell().Background("#1E293B").Padding(4).Text("Timestamp").Bold().FontColor(Colors.White);
                        });

                        int idx = 0;
                        foreach (var a in audits.Take(40))
                        {
                            string bg = idx % 2 == 1 ? "#F8FAFC" : "#FFFFFF";
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(a.AuditLogId.ToString());
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(a.ActionType).SemiBold();
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(a.EntityType);
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(a.EntityId ?? "-");
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(a.Description);
                            table.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E2E8F0").Padding(3).Text(a.CreatedAtUtc.ToString("yyyy-MM-dd HH:mm"));
                            idx++;
                        }

                        if (!audits.Any())
                        {
                            table.Cell().ColumnSpan(6).Padding(8).AlignCenter().Text("No administrative audit log records in this period.").Italic().FontColor("#64748B");
                        }
                    });
                });

                page.Footer().Element(ComposeFooter);
            });
        }).GeneratePdf();
    }

    // =========================================================================
    // COMMON HELPERS
    // =========================================================================

    private static void ComposeHeader(IContainer container, string title, string rangeLabel)
    {
        container.BorderBottom(1.5f).BorderColor("#0F172A").PaddingBottom(8).Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("ElectroSL Operations & Financial Intelligence").FontSize(14).Bold().FontColor("#0F172A");
                col.Item().Text(title).FontSize(10).SemiBold().FontColor("#2563EB");
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text($"Range: {rangeLabel}").FontSize(8).FontColor("#64748B");
                col.Item().Text($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC").FontSize(8).FontColor("#64748B");
            });
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.BorderTop(0.5f).BorderColor("#CBD5E1").PaddingTop(4).Row(row =>
        {
            row.RelativeItem().Text("ElectroSL Proprietary & Confidential — Authorized Administrative Access Only").FontSize(7).FontColor("#94A3B8");
            row.RelativeItem().AlignRight().Text(text =>
            {
                text.Span("Page ").FontSize(7).FontColor("#94A3B8");
                text.CurrentPageNumber().FontSize(7).FontColor("#94A3B8");
                text.Span(" of ").FontSize(7).FontColor("#94A3B8");
                text.TotalPages().FontSize(7).FontColor("#94A3B8");
            });
        });
    }

    private static string EscapeCsv(string val)
    {
        if (string.IsNullOrEmpty(val)) return "\"\"";
        return $"\"{val.Replace("\"", "\"\"")}\"";
    }
}
