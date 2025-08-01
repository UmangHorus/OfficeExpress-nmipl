import api from '@/lib/api/axios';
const AUTHORIZE_KEY = process.env.NEXT_PUBLIC_API_AUTH_KEY || '';

const DashboardService = {
  getDashboardData: async (token, id) => {
    const formData = new FormData();
    formData.append('AUTHORIZEKEY', AUTHORIZE_KEY);
    formData.append('PHPTOKEN', token);
    formData.append('employee_id', id); // Append employee_id

    const response = await api.post('/expo_access_api/getDashboardCount', formData);
    return response.data;
  },
};

export default DashboardService;