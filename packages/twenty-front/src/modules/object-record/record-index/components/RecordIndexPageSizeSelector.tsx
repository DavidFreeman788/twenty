import styled from '@emotion/styled';
import { t } from '@lingui/core/macro';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  RECORD_INDEX_PAGE_SIZE_OPTIONS,
  recordIndexPageSizeState,
} from '@/object-record/record-index/states/recordIndexPageSizeState';
import { recordIndexViewTypeState } from '@/object-record/record-index/states/recordIndexViewTypeState';
import { ViewType } from '@/views/types/ViewType';
import { Button } from 'twenty-ui/input';

const StyledContainer = styled.div`
  align-items: center;
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const StyledLabel = styled.span`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.sm};
  white-space: nowrap;
`;

const StyledButtons = styled.div`
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const RecordIndexPageSizeSelector = () => {
  const [recordIndexPageSize, setRecordIndexPageSize] =
    useRecoilState(recordIndexPageSizeState);

  const recordIndexViewType = useRecoilValue(recordIndexViewTypeState);

  if (recordIndexViewType !== ViewType.Table) {
    return null;
  }

  return (
    <StyledContainer>
      <StyledLabel>{t`Rows`}</StyledLabel>
      <StyledButtons>
        {RECORD_INDEX_PAGE_SIZE_OPTIONS.map((pageSizeOption) => (
          <Button
            key={pageSizeOption}
            title={String(pageSizeOption)}
            size="small"
            variant={
              pageSizeOption === recordIndexPageSize ? 'primary' : 'secondary'
            }
            onClick={() => setRecordIndexPageSize(pageSizeOption)}
          />
        ))}
      </StyledButtons>
    </StyledContainer>
  );
};
