import Papa from 'papaparse';
import { z } from 'zod';
import type { CsvRow, ParsedTransaction } from '../types/transactions';

// Zod schema for CSV row validation
const csvRowSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.string(),
  type: z.enum(['income', 'expense', 'Income', 'Expense']),
  category: z.string().optional(),
  source: z.string().optional(),
  isDeductible: z.string().optional(),
});

export const parseCsvFile = async (file: File): Promise<ParsedTransaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const validatedRows = results.data.map((row, index) => {
            try {
              return csvRowSchema.parse(row);
            } catch (error) {
              throw new Error(`Invalid data at row ${index + 1}: ${error}`);
            }
          });

          const parsedTransactions: ParsedTransaction[] = validatedRows.map((row) => {
            const amount = parseFloat(row.amount.replace(/[,\s]/g, ''));
            if (isNaN(amount)) {
              throw new Error(`Invalid amount: ${row.amount}`);
            }

            const date = new Date(row.date);
            if (isNaN(date.getTime())) {
              throw new Error(`Invalid date: ${row.date}`);
            }

            return {
              date,
              description: row.description.trim(),
              amount: Math.abs(amount), // Always positive
              type: row.type.toLowerCase() as 'income' | 'expense',
              category: row.category?.trim() || 'Uncategorized',
              source: row.source?.trim() || 'Manual Entry',
              isDeductible: row.isDeductible?.toLowerCase() === 'true' || row.isDeductible?.toLowerCase() === 'yes',
            };
          });

          resolve(parsedTransactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
};

export const validateCsvHeaders = (headers: string[]): boolean => {
  const requiredHeaders = ['date', 'description', 'amount', 'type'];
  return requiredHeaders.every(header => headers.includes(header));
};

export const getCsvTemplate = (): string => {
  return 'date,description,amount,type,category,source,isDeductible\n' +
         '2024-01-15,Salary Payment,50000,income,Salary,Employer,false\n' +
         '2024-01-16,Grocery Shopping,5000,expense,Food,Supermarket,false\n' +
         '2024-01-17,Office Supplies,2000,expense,Office,Stationery Store,true';
};
