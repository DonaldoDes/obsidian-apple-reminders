export class DateFormatter {
  private static readonly formatPatterns = [
    "YYYY-MM-DD",
    "DD.MM.YYYY", 
    "MM-DD-YYYY",
    "DD-MM-YYYY",
    "MM.DD.YYYY",
    "YYYY.MM.DD",
    "YYYY/MM/DD",
    "DD/MM/YYYY",
    "MM/DD/YYYY"
  ];

  static getFormats() {
    const formats = [];
    
    this.formatPatterns.forEach(format => {
      const separator = format.includes(".") ? "\\." : format.includes("/") ? "\\/" : "-";
      
      formats.push(
        {
          regex: new RegExp(`\\d{1,4}${separator}\\d{1,2}${separator}\\d{1,4} \\d{1,2}:\\d{1,2}( )?([apm]{2})`, "ig"),
          formatToUser: `${format} hh:mm A`,
          formatToPicker: "YYYY-MM-DDTHH:mm", 
          type: "DATETIME"
        },
        {
          regex: new RegExp(`\\d{1,4}${separator}\\d{1,2}${separator}\\d{1,4} \\d{1,2}:\\d{1,2}`, "g"),
          formatToUser: `${format} HH:mm`,
          formatToPicker: "YYYY-MM-DDTHH:mm",
          type: "DATETIME"
        },
        {
          regex: new RegExp(`\\d{1,4}${separator}\\d{1,2}${separator}\\d{1,4}`, "g"),
          formatToUser: format,
          formatToPicker: "YYYY-MM-DD",
          type: "DATE"
        }
      );
    });

    formats.push(
      {
        regex: /\d{1,2}:\d{1,2}( )?([apm]{2})/ig,
        formatToUser: "hh:mm A",
        formatToPicker: "HH:mm",
        type: "TIME"
      },
      {
        regex: /\d{1,2}:\d{1,2}/g,
        formatToUser: "HH:mm",
        formatToPicker: "HH:mm",
        type: "TIME"
      }
    );

    return formats;
  }
} 