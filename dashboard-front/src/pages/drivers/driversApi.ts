import { api } from '../../app/rtk';

export interface Driver {
  id?: string;
  name: string;
  licenseNumber: string;
  nationalId: string;
  contact: string;
  email?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export const driversApi = api.injectEndpoints({
  endpoints: (build) => ({
    listDrivers: build.query<Driver[], void>({
      query: () => ({ url: '/drivers' }),
      transformResponse: (res: any) => res.data ?? res, // your backend sometimes wraps in {data}
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Driver' as const, id })), { type: 'Driver', id: 'LIST' }] :
                 [{ type: 'Driver', id: 'LIST' }],
    }),
    addDriver: build.mutation<{ id: string }, Partial<Driver>>({
      query: (body) => ({ url: '/drivers/add', method: 'POST', body }),
      invalidatesTags: [{ type: 'Driver', id: 'LIST' }],
    }),
  }),
});

export const { useListDriversQuery, useAddDriverMutation } = driversApi;