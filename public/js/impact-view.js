import { fetchImpact, isAbortError } from './api.js';
import {
  createEl,
  formatViNumber,
  getBrowserStorage,
  getPendingCalcCount
} from './state.js';

export function createImpactView({
  container,
  onNavigatePost,
  onNavigateCalc
}) {
  const storage = getBrowserStorage();
  let metrics = null;
  let loading = false;
  let errorMessage = '';
  let isOffline = false;
  let activeAbort = null;
  let mounted = false;

  const headerBlock = createEl('div', { className: 'screen-header' },
    createEl('h1', { id: 'heading-impact', className: 'screen-title', text: 'Tác động cộng đồng' }),
    createEl('p', {
      className: 'screen-lead',
      text: 'Cộng đồng đã cứu được bao nhiêu phụ phẩm và giảm bao nhiêu CO₂?'
    })
  );

  const stateNotice = createEl('div', { attrs: { hidden: true } });
  const focalBlock = createEl('div', { className: 'surface-block notice-green' });
  const statsList = createEl('div', { className: 'divider-list' });
  const formulaDetails = createEl('details', { className: 'details-block' },
    createEl('summary', { text: 'Công thức quy đổi và nguồn số liệu' }),
    createEl('div', { className: 'field-group' },
      createEl('p', {
        className: 'listing-note',
        text: 'Hệ số ước tính: 1 kg phụ phẩm được thu gom tái sử dụng (làm nấm, thức ăn gia súc, ủ phân) giúp tránh phát thải khoảng 1,46 kg CO₂ tương đương so với đốt bỏ ngoài đồng (tham chiếu hệ số phát thải đốt rơm rạ của IPCC/FAO).'
      }),
      createEl('p', {
        className: 'field-hint',
        text: 'Khối lượng cứu được ưu tiên tính theo số kg thu gom thực tế đã xác nhận, nếu chưa nhập sẽ lấy theo khối lượng ước tính quy đổi.'
      })
    )
  );

  const refreshBtn = createEl('button', {
    type: 'button',
    className: 'btn btn-primary',
    text: 'Làm mới số liệu',
    onClick: () => loadImpact()
  });

  container.append(
    headerBlock,
    stateNotice,
    focalBlock,
    statsList,
    formulaDetails,
    refreshBtn
  );

  function renderBody() {
    refreshBtn.disabled = loading;

    if (loading && !metrics) {
      stateNotice.className = 'surface-block';
      stateNotice.replaceChildren(createEl('p', { className: 'field-hint', text: 'Đang tải số liệu tác động...' }));
      stateNotice.hidden = false;
      focalBlock.hidden = true;
      statsList.hidden = true;
      return;
    }

    if (errorMessage) {
      stateNotice.className = 'surface-block';
      stateNotice.replaceChildren(
        createEl('div', { className: 'notice-box notice-red', text: errorMessage }),
        createEl('div', { className: 'row-inline' },
          createEl('button', {
            type: 'button',
            className: 'btn btn-inline-primary',
            text: 'Thử lại',
            onClick: () => loadImpact()
          }),
          isOffline || !globalThis.navigator?.onLine
            ? createEl('button', {
                type: 'button',
                className: 'btn btn-secondary',
                text: 'Mở Công cụ tính giá',
                onClick: () => onNavigateCalc()
              })
            : null
        )
      );
      stateNotice.hidden = false;
      focalBlock.hidden = !metrics;
      statsList.hidden = !metrics;
      if (!metrics) {
        return;
      }
    } else {
      stateNotice.hidden = true;
    }

    if (!metrics) {
      return;
    }

    const pending = getPendingCalcCount(storage);
    const isEmpty =
      metrics.totalListings === 0 &&
      metrics.collectedListings === 0 &&
      metrics.totalPriceCalculations === 0 &&
      pending === 0;

    if (isEmpty) {
      stateNotice.className = 'surface-block';
      stateNotice.replaceChildren(
        createEl('p', {
          text: 'Chưa có dữ liệu thu gom hoặc tính giá nào. Hãy đăng phụ phẩm đầu tiên để bắt đầu ghi nhận tác động.'
        }),
        createEl('div', { className: 'row-inline' },
          createEl('button', {
            type: 'button',
            className: 'btn btn-inline-primary',
            text: 'Đăng tin phụ phẩm',
            onClick: () => onNavigatePost()
          })
        )
      );
      stateNotice.hidden = false;
    }

    focalBlock.hidden = false;
    statsList.hidden = false;

    focalBlock.replaceChildren(
      createEl('p', { className: 'field-label', text: 'Tổng khối lượng phụ phẩm đã cứu khỏi đốt bỏ' }),
      createEl('p', { className: 'focal-number', text: `${formatViNumber(metrics.totalKgDiverted, 1)} kg` }),
      createEl('p', { className: 'field-label', text: 'Ước tính khí thải CO₂ tránh phát thải (1,46 kg CO₂/kg)' }),
      createEl('p', { className: 'focal-number', text: `${formatViNumber(metrics.estimatedCo2SavedKg, 2)} kg CO₂` })
    );

    statsList.replaceChildren(
      createEl('div', { className: 'stat-row' },
        createEl('span', { text: 'Tổng số tin đã đăng' }),
        createEl('span', { className: 'stat-value', text: formatViNumber(metrics.totalListings, 0) })
      ),
      createEl('div', { className: 'stat-row' },
        createEl('span', { text: 'Tin đang mở trên bản đồ' }),
        createEl('span', { className: 'stat-value', text: formatViNumber(metrics.activeListings, 0) })
      ),
      createEl('div', { className: 'stat-row' },
        createEl('span', { text: 'Số lượt đã thu gom thành công' }),
        createEl('span', { className: 'stat-value', text: formatViNumber(metrics.collectedListings, 0) })
      ),
      createEl('div', { className: 'stat-row' },
        createEl('span', { text: 'Tổng lượt tra cứu định giá độ tươi' }),
        createEl('span', { className: 'stat-value', text: formatViNumber(metrics.totalPriceCalculations, 0) })
      )
    );
  }

  async function loadImpact() {
    if (activeAbort) {
      activeAbort.abort();
    }
    const controller = new AbortController();
    activeAbort = controller;
    loading = true;
    errorMessage = '';
    isOffline = false;
    renderBody();

    try {
      const data = await fetchImpact({ signal: controller.signal });
      if (activeAbort !== controller) {
        return;
      }
      metrics = data;
      loading = false;
      renderBody();
    } catch (err) {
      if (isAbortError(err) || activeAbort !== controller) {
        return;
      }
      loading = false;
      isOffline = Boolean(err?.isOffline || err?.isNetworkError || !globalThis.navigator?.onLine);
      errorMessage = err?.message || 'Không thể tải số liệu tác động.';
      renderBody();
    }
  }

  return {
    onShow() {
      mounted = true;
      loadImpact();
    },
    refresh() {
      if (mounted) {
        loadImpact();
      }
    }
  };
}
