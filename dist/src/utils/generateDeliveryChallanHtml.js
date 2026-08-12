// src/utils/generateDeliveryChallanHtml.ts
// Delivery Challan ka printable HTML banata hai — reference image jaisa design.
// Browser me naya tab open hoga aur window.print() se PDF save/print ho jayega
// (bilkul waise hi jaise "Send Quotation" / "Order Bill" already kaam karte hain).
const checklistLabels = [
    { key: "invoiceBill", label: "Invoice Bill" },
    { key: "accessoriesInvoice", label: "Accessories Invoice" },
    { key: "serviceBook", label: "Service Book" },
    { key: "insuranceCopy", label: "Insurance Copy" },
    { key: "helmetInvoice", label: "Helmet Invoice" },
    { key: "warrantyBook", label: "Warranty Book" },
    { key: "rtoReceipt", label: "RTO Receipt" },
    { key: "keychainPouch", label: "Keychain Pouch" },
    { key: "allGuard", label: "All Guard" },
    { key: "matting", label: "Matting" },
    { key: "footrest", label: "Footrest" },
    { key: "helmet", label: "Helmet" },
    { key: "visor", label: "Visor" },
    { key: "seatCover", label: "Seat Cover" },
    { key: "bodyCover", label: "Body Cover" },
    { key: "mirrorSet", label: "Mirror Set" },
    { key: "other", label: "Other" },
];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function generateDeliveryChallanHtml(data) {
    const checklistCells = checklistLabels
        .map(({ key, label }) => `
        <div class="check-item">
          <span class="checkbox ${data.checklist[key] ? "checked" : ""}"></span>
          <span>${esc(label)}:</span>
        </div>`)
        .join("");
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Delivery Challan</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
    margin: 0;
    padding: 24px;
    background: #f3f3f3;
  }
  .sheet {
    max-width: 760px;
    margin: 0 auto;
    background: #fff;
    border: 2px solid #000;
    padding: 24px 28px;
  }
 .header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 15px;
}

.logo-box {
  width: 130px;
  flex-shrink: 0;
}

.logo {
  width: 120px;
  height: auto;
  object-fit: contain;
}

.company-box {
  flex: 1;
  text-align: center;
}

.company-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.company-line {
  font-size: 12px;
  line-height: 1.4;
  word-break: break-word;
}

.title {
  font-size: 18px;
  font-weight: bold;
  text-decoration: underline;
  margin-top: 8px;
}
  .date-row { text-align: right; font-size: 13px; margin: 10px 0; }
  .date-row .line { display: inline-block; min-width: 160px; border-bottom: 1px solid #000; }

  table.info { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }
  table.info td {
    border: 1px solid #000;
    padding: 6px 8px;
    width: 50%;
  }
  table.info b { font-weight: bold; }

  .checklist {
    border: 1px solid #000;
    padding: 10px 14px;
    margin-bottom: 12px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    row-gap: 8px;
    column-gap: 10px;
    font-size: 13px;
  }
  .check-item { display: flex; align-items: center; gap: 8px; }

  /* ── Checkbox: unchecked = plain white box with black border,
     checked = solid blue box with white tick (jaisa reference image me hai) ── */
  .checkbox {
    width: 15px;
    height: 15px;
    border: 1.5px solid #000;
    display: inline-block;
    flex-shrink: 0;
    position: relative;
    background: #fff;
    border-radius: 2px;
  }
  .checkbox.checked {
    background: #2563eb;
    border-color: #2563eb;
  }
  .checkbox.checked::after {
    content: "";
    position: absolute;
    left: 4px;
    top: 1px;
    width: 4px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .finance-box {
    border: 1px solid #000;
    padding: 8px 10px;
    font-size: 13px;
    margin-bottom: 26px;
  }
  .finance-box .line { border-bottom: 1px solid #000; display: inline-block; min-width: 60%; }

  .signatures {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    text-align: center;
    font-size: 12px;
    margin-bottom: 26px;
  }
  .signatures .sig-line { border-top: 1px solid #000; margin-top: 34px; padding-top: 4px; }

  .disclaimer { font-size: 11px; line-height: 1.5; margin-bottom: 30px; }

 .customer-sign {
  width: 100%;
  margin-top: 35px;
  display: flex;
  justify-content: flex-end;
}

.customer-box {
  width: 230px;
  text-align: center;
}

.customer-box .line {
  border-top: 1px solid #000;
  margin-bottom: 6px;
}

.customer-box .label {
  font-size: 14px;
  font-weight: bold;
}

  @media print {
    body { background: #fff; padding: 0; }
    .sheet { border: 2px solid #000; max-width: 100%; }
    .checkbox.checked {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
</head>
<body>
  <div class="sheet">
   <div class="header">

  <div class="logo-box">
    ${data.logoUrl
        ? `<img class="logo" src="${esc(data.logoUrl)}" alt="logo">`
        : ""}
  </div>

  <div class="company-box">
    <div class="company-name">${esc(data.companyName)}</div>

    <div class="company-line">
      ${esc(data.addressLine1)}
    </div>

    <div class="company-line">
      Phone No. ${esc(data.mobileNumber)}
    </div>

    <div class="title">
      DELIVERY CHALLAN
    </div>
  </div>

</div>

    <div class="date-row">Date: <span class="line">&nbsp;</span></div>

    <table class="info">
      <tr>
        <td><b>Customer Name:</b> ${esc(data.customerName)}</td>
        <td><b>Model:</b> ${esc(data.model)}</td>
      </tr>
      <tr>
        <td><b>Colour:</b> ${esc(data.colour)}</td>
        <td><b>Key No:</b> ${esc(data.keyNo)}</td>
      </tr>
      <tr>
        <td><b>Chassis No:</b> ${esc(data.chassisNo)}</td>
        <td><b>Eng. No:</b> ${esc(data.engineNo)}</td>
      </tr>
      <tr>
        <td><b>Registration No:</b> ${esc(data.registrationNo)}</td>
        <td><b>Mob. No:</b> ${esc(data.mobileNo)}</td>
      </tr>
    </table>

    <div class="checklist">${checklistCells}</div>

    <div class="finance-box">
      <b>Finance / Bank Name:</b> <span class="line">${esc(data.financeBankName)}</span>
    </div>

    <div class="signatures">
      <div><div class="sig-line">Sales Executive</div></div>
      <div><div class="sig-line">Back Office</div></div>
      <div><div class="sig-line">Accounts</div></div>
      <div><div class="sig-line">Authority Sign</div></div>
    </div>

    <div class="disclaimer">
      I have been informed that due to the NEW RTO REGISTRATION POLICY, I will get the delivery of my vehicle after
      registration. I have received detailed information regarding features, warranty policy, and service schedule,
      and also received all related documents. I am satisfied with the same.
    </div>

    <div class="customer-sign">
  <div class="customer-box">
    <div class="line"></div>
    <div class="label">Customer Signature</div>
  </div>
</div>
  </div>

  <script>
    // Naya tab open hote hi print dialog khul jayega (Order Bill jaisa hi behavior).
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;
}
//# sourceMappingURL=generateDeliveryChallanHtml.js.map