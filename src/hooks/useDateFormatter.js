import { format, parse, parseISO } from 'date-fns';

const useDateFormatter = () => {
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Try parsing as ISO format first (yyyy-MM-dd)
      const isoDate = parseISO(dateString);
      if (!isNaN(isoDate)) {
        return format(isoDate, 'yyyy-MM-dd');
      }
      
      // Try parsing as dd/MM/yyyy format
      const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
      if (!isNaN(parsedDate)) {
        return format(parsedDate, 'yyyy-MM-dd');
      }
      
      // Fallback to current date if parsing fails
      return format(new Date(), 'yyyy-MM-dd');
    } catch (e) {
      console.error('Date parsing error:', e);
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  return { formatDateForInput };
};

export default useDateFormatter;