export class DateFormatter {
  private static readonly DATE_FORMATS = {
    ISO: "YYYY-MM-DD",
    EU: "DD.MM.YYYY",
    US: "MM-DD-YYYY",
    // ... autres formats
  };

  static getFormats() {
    return Object.values(this.DATE_FORMATS).flatMap(format => {
      const separator = this.getSeparator(format);
      return this.createFormatVariants(format, separator);
    });
  }

  private static getSeparator(format: string): string {
    if (format.includes(".")) return "\\.";
    if (format.includes("/")) return "\\/";
    return "-";
  }

  private static createFormatVariants(format: string, separator: string) {
    return [
      {
        regex: new RegExp(`\\d{1,4}${separator}\\d{1,2}${separator}\\d{1,4} \\d{1,2}:\\d{1,2}( )?([apm]{2})`, "ig"),
        formatToUser: `${format} hh:mm A`,
        formatToPicker: "YYYY-MM-DDTHH:mm",
        type: "DATETIME"
      },
      // ... autres variantes
    ];
  }
} 