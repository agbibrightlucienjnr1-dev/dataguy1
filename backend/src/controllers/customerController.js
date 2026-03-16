import { asyncHandler } from "../middlewares/errorHandler.js";
import { getCustomers } from "../services/customerService.js";

const toCsv = (customers) => {
  const headers = [
    "Phone",
    "Name",
    "Total Orders",
    "Successful Orders",
    "First Order",
    "Last Order",
  ];

  const rows = customers.map((c) => [
    c.phone,
    c.name || "",
    c.totalOrdersCount ?? 0,
    c.successfulOrdersCount ?? 0,
    c.firstOrderAt ? new Date(c.firstOrderAt).toISOString() : "",
    c.lastOrderAt ? new Date(c.lastOrderAt).toISOString() : "",
  ]);

  const csvLines = [headers.join(",")];
  for (const row of rows) {
    csvLines.push(
      row
        .map((value) => {
          if (value == null) return "";
          const str = String(value);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/\"/g, '""')}"`;
          }
          return str;
        })
        .join(","),
    );
  }

  return csvLines.join("\n");
};

export const listCustomers = asyncHandler(async (req, res) => {
  const user = req.user;
  const customers = await getCustomers(user);

  res.status(200).json({
    success: true,
    customers,
    count: customers.length,
  });
});

export const exportCustomersCsv = asyncHandler(async (req, res) => {
  const user = req.user;
  const customers = await getCustomers(user);
  const csv = toCsv(customers);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=customers-${user.role}-${Date.now()}.csv`,
  );
  res.status(200).send(csv);
});
