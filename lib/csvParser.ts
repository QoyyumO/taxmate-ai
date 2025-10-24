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
  try {
    // Convert File to text for server-side parsing
    const text = await file.text();
    console.log('CSV text content:', text.substring(0, 200));
    
    // Parse CSV manually to avoid FileReaderSync issues
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    console.log('CSV headers:', headers);
    
    const dataRows = lines.slice(1);
    console.log('CSV data rows:', dataRows.length);
    
    const parsedTransactions: ParsedTransaction[] = [];
    
    // Check if this is a bank statement format (Date, Ref/Chq.N, Narration, Debit, Credit, Balance)
    const isBankStatement = headers.includes('debit') && headers.includes('credit');
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Better CSV parsing that handles quoted fields and commas within quotes
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < row.length; j++) {
        const char = row[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      
      if (values.length < 3) {
        console.warn(`Skipping row ${i + 1}: insufficient columns`);
        continue;
      }
      
      try {
        let rowData: any;
        
        if (isBankStatement) {
          // Bank statement format: Date, Ref/Chq.N, Narration, Debit, Credit, Balance
          const dateIndex = headers.indexOf('date');
          const narrationIndex = headers.indexOf('narration');
          const debitIndex = headers.indexOf('debit');
          const creditIndex = headers.indexOf('credit');
          const refIndex = headers.indexOf('ref') || headers.indexOf('ref/chq.n');
          
          if (dateIndex === -1 || narrationIndex === -1 || (debitIndex === -1 && creditIndex === -1)) {
            console.warn(`Skipping row ${i + 1}: missing required columns`);
            continue;
          }
          
          const debitAmount = debitIndex !== -1 ? parseFloat((values[debitIndex] || '0').replace(/,/g, '')) : 0;
          const creditAmount = creditIndex !== -1 ? parseFloat((values[creditIndex] || '0').replace(/,/g, '')) : 0;
          
          // Determine transaction type and amount
          let amount = 0;
          let type = 'expense';
          
          if (debitAmount > 0) {
            amount = debitAmount;
            type = 'expense';
          } else if (creditAmount > 0) {
            amount = creditAmount;
            type = 'income';
          } else {
            console.warn(`Skipping row ${i + 1}: no valid amount`);
            continue;
          }
          
          rowData = {
            date: values[dateIndex],
            description: values[narrationIndex],
            amount: amount.toString(),
            type: type,
            category: 'Bank Transaction',
            source: 'Bank Statement',
            isDeductible: 'false',
            reference: refIndex !== -1 ? values[refIndex] : undefined,
          };
        } else {
          // Standard format: date, description, amount, type, category, source, isDeductible
          if (values.length < 4) {
            console.warn(`Skipping row ${i + 1}: insufficient columns for standard format`);
            continue;
          }
          
          rowData = {
            date: values[0],
            description: values[1],
            amount: values[2],
            type: values[3] as 'income' | 'expense' | 'Income' | 'Expense',
            category: values[4] || 'Uncategorized',
            source: values[5] || 'Manual Entry',
            isDeductible: values[6] || 'false',
          };
        }
        
        // Validate the row
        const validatedRow = csvRowSchema.parse(rowData);
        
        const amount = parseFloat(validatedRow.amount.replace(/[,\s]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          throw new Error(`Invalid amount: ${validatedRow.amount}`);
        }

        const date = new Date(validatedRow.date);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date: ${validatedRow.date}`);
        }

        parsedTransactions.push({
          date,
          description: validatedRow.description.trim(),
          amount: Math.abs(amount), // Always positive
          type: validatedRow.type.toLowerCase() as 'income' | 'expense',
          category: validatedRow.category?.trim() || 'Uncategorized',
          source: validatedRow.source?.trim() || 'Manual Entry',
          isDeductible: validatedRow.isDeductible?.toLowerCase() === 'true' || validatedRow.isDeductible?.toLowerCase() === 'yes',
        });
        
      } catch (error) {
        console.warn(`Skipping row ${i + 1}: ${error}`);
        continue;
      }
    }
    
    if (parsedTransactions.length === 0) {
      throw new Error('No valid transactions found in CSV file');
    }
    
    console.log('Parsed transactions:', parsedTransactions.length);
    return parsedTransactions;
    
  } catch (error) {
    console.error('CSV parsing error:', error);
    throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
