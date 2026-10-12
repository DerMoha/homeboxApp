import {AxiosInstance} from 'axios';
import {deleteAttachment, updateAttachment} from '../serverApi/attachmentsApi';

test('updates title, category, and primary-photo state using the attachment endpoint', async () => {
  const put = jest
    .fn()
    .mockResolvedValue({
      data: {
        id: 'item',
        name: 'Drill',
        attachments: [{id: 'photo', type: 'photo', primary: true}],
      },
    });
  const result = await updateAttachment(
    {put} as unknown as AxiosInstance,
    'item',
    'photo',
    {title: 'Serial number', type: 'photo', primary: true},
  );
  expect(put).toHaveBeenCalledWith('/api/v1/entities/item/attachments/photo', {
    title: 'Serial number',
    type: 'photo',
    primary: true,
  });
  expect(result.data?.attachments?.[0].primary).toBe(true);
});
test('removes an attachment without deleting the item', async () => {
  const remove = jest.fn().mockResolvedValue({status: 204});
  expect(
    await deleteAttachment(
      {delete: remove} as unknown as AxiosInstance,
      'item',
      'photo',
    ),
  ).toEqual({success: true});
  expect(remove).toHaveBeenCalledWith(
    '/api/v1/entities/item/attachments/photo',
  );
});
