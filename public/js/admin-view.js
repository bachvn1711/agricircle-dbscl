import { BYPRODUCT_CATEGORIES, getByproductCategoryById } from '/shared/crops.js';
import { UNITS, getUnitById } from '/shared/units.js';
import {
  adminLogin,
  adminLogout,
  adminPatchCrop,
  adminPatchListing,
  downloadAdminCsv,
  fetchAdminListings,
  isAbortError
} from './api.js';
import {
  createEl,
  formatViNumber,
  formatVnd,
  parseStrictInt,
  parseStrictNumber
} from './state.js';

function getStatusBadge(status) {
  switch (status) {
    case 'reported':
      return { text: 'Bị báo cáo', className: 'pill pill-red' };
    case 'hidden':
      return { text: 'Đã ẩn', className: 'pill pill-amber' };
    case 'collected':
      return { text: 'Đã thu gom', className: 'pill pill-neutral' };
    default:
      return { text: 'Đang mở', className: 'pill pill-green' };
  }
}

export function createAdminView({
  container,
  getCrops,
  onCropsChanged,
  onListingsChanged
}) {
  let authState = 'checking';
  let adminListings = [];
  let statusMessage = '';
  let statusKind = 'green';
  let errorMessage = '';
  let configError = '';
  let offlineError = '';
  let busy = false;
  let editingListingId = null;
  let editingCropId = null;
  let activeAbort = null;

  const headerBlock = createEl('div', { className: 'screen-header' },
    createEl('h1', { id: 'heading-admin', className: 'screen-title', text: 'Quản trị hệ thống và dữ liệu KHKT' }),
    createEl('p', {
      id: 'admin-question-lead',
      className: 'screen-lead',
      text: 'Nhập mã bảo vệ?'
    })
  );

  const bodyHost = createEl('div');
  container.append(headerBlock, bodyHost);

  const questionLead = headerBlock.querySelector('#admin-question-lead');

  function setStatus(msg, kind = 'green') {
    statusMessage = msg;
    statusKind = kind;
  }

  function renderLockedView() {
    questionLead.textContent = 'Nhập mã bảo vệ?';
    bodyHost.replaceChildren();

    if (offlineError) {
      bodyHost.appendChild(createEl('div', { className: 'surface-block' },
        createEl('div', { className: 'notice-box notice-amber', text: offlineError }),
        createEl('button', {
          type: 'button',
          className: 'btn btn-primary',
          text: 'Thử kết nối lại',
          onClick: () => checkSessionAndLoad()
        })
      ));
      return;
    }

    if (configError) {
      bodyHost.appendChild(createEl('div', { className: 'surface-block' },
        createEl('div', { className: 'notice-box notice-red', text: configError }),
        createEl('button', {
          type: 'button',
          className: 'btn btn-secondary',
          text: 'Kiểm tra lại',
          onClick: () => checkSessionAndLoad()
        })
      ));
      return;
    }

    const pinInput = createEl('input', {
      id: 'admin-pin-input',
      className: 'text-input',
      type: 'password',
      attrs: {
        inputmode: 'numeric',
        autocomplete: 'current-password',
        minlength: '6',
        placeholder: 'Nhập mã PIN quản trị (ít nhất 6 ký tự)'
      }
    });
    const loginErrEl = createEl('div', {
      className: 'notice-box notice-red',
      text: errorMessage,
      attrs: { hidden: !errorMessage, role: 'alert' }
    });
    const loginBtn = createEl('button', {
      type: 'submit',
      className: 'btn btn-primary',
      text: 'Đăng nhập quản trị'
    });

    const form = createEl('form', { className: 'surface-block' },
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Mã PIN quản trị', attrs: { for: 'admin-pin-input' } }),
        pinInput
      ),
      loginErrEl,
      loginBtn
    );

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (loginBtn.disabled) {
        return;
      }
      const pin = pinInput.value;
      if (typeof pin !== 'string' || pin.trim().length < 6) {
        loginErrEl.textContent = 'Mã PIN phải có ít nhất 6 ký tự.';
        loginErrEl.hidden = false;
        return;
      }
      loginBtn.disabled = true;
      loginErrEl.hidden = true;
      errorMessage = '';
      try {
        await adminLogin(pin);
        pinInput.value = '';
        setStatus('Đã mở khóa phiên quản trị.', 'green');
        await checkSessionAndLoad();
      } catch (err) {
        if (err?.isNetworkError || err?.isOffline || !globalThis.navigator?.onLine) {
          offlineError = 'Chức năng Quản trị cần kết nối mạng trực tiếp tới máy chủ và không lưu bộ nhớ đệm ngoại tuyến.';
          renderLockedView();
          return;
        }
        if (err?.status === 503) {
          configError = err.message;
          renderLockedView();
          return;
        }
        loginErrEl.textContent = err?.message || 'Đăng nhập quản trị thất bại.';
        loginErrEl.hidden = false;
      } finally {
        loginBtn.disabled = false;
      }
    });

    bodyHost.appendChild(form);
  }

  function renderListingEditForm(listing) {
    const categoryId = `admin-edit-category-${listing.id}`;
    const qtyId = `admin-edit-quantity-${listing.id}`;
    const unitId = `admin-edit-unit-${listing.id}`;
    const offerId = `admin-edit-offer-${listing.id}`;
    const priceNoteId = `admin-edit-price-note-${listing.id}`;
    const locationNoteId = `admin-edit-location-note-${listing.id}`;
    const expiryId = `admin-edit-expiry-${listing.id}`;

    const categorySelect = createEl('select', { id: categoryId, className: 'select-input' });
    for (const cat of BYPRODUCT_CATEGORIES) {
      categorySelect.appendChild(createEl('option', { text: cat.name, attrs: { value: cat.id } }));
    }
    categorySelect.value = listing.category;

    const qtyInput = createEl('input', {
      id: qtyId,
      className: 'text-input',
      type: 'text',
      attrs: { inputmode: 'decimal' }
    });
    qtyInput.value = String(listing.rawQuantity);

    const unitSelect = createEl('select', { id: unitId, className: 'select-input' });
    for (const u of UNITS) {
      unitSelect.appendChild(createEl('option', { text: u.name, attrs: { value: u.id } }));
    }
    unitSelect.value = listing.rawUnit;

    const offerSelect = createEl('select', { id: offerId, className: 'select-input' });
    offerSelect.append(
      createEl('option', { text: 'Cho miễn phí', attrs: { value: 'free' } }),
      createEl('option', { text: 'Bán giá rẻ', attrs: { value: 'sell' } })
    );
    offerSelect.value = listing.offerType;

    const priceNoteInput = createEl('input', {
      id: priceNoteId,
      className: 'text-input',
      type: 'text',
      attrs: { maxlength: '160' }
    });
    priceNoteInput.value = listing.priceNote || '';

    const locationNoteInput = createEl('input', {
      id: locationNoteId,
      className: 'text-input',
      type: 'text',
      attrs: { maxlength: '200' }
    });
    locationNoteInput.value = listing.locationNote || '';

    const expiryInput = createEl('input', {
      id: expiryId,
      className: 'text-input',
      type: 'text',
      attrs: { inputmode: 'numeric' }
    });
    const remainingDays = Math.min(14, Math.max(1, Math.ceil((listing.expiresAt - Date.now()) / 86400000)));
    expiryInput.value = String(remainingDays);

    const editErr = createEl('div', { className: 'notice-box notice-red', attrs: { hidden: true } });
    const saveBtn = createEl('button', { type: 'submit', className: 'btn btn-inline-primary', text: 'Lưu chỉnh sửa' });
    const cancelBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      text: 'Hủy',
      onClick: () => {
        editingListingId = null;
        renderUnlockedView();
      }
    });

    const editForm = createEl('form', { className: 'sheet-section' },
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Nhóm phụ phẩm', attrs: { for: categoryId } }),
        categorySelect
      ),
      createEl('div', { className: 'filter-grid' },
        createEl('div', { className: 'field-group' },
          createEl('label', { className: 'field-label', text: 'Số lượng', attrs: { for: qtyId } }),
          qtyInput
        ),
        createEl('div', { className: 'field-group' },
          createEl('label', { className: 'field-label', text: 'Đơn vị', attrs: { for: unitId } }),
          unitSelect
        ),
        createEl('div', { className: 'field-group' },
          createEl('label', { className: 'field-label', text: 'Hình thức', attrs: { for: offerId } }),
          offerSelect
        )
      ),
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Ghi chú giá', attrs: { for: priceNoteId } }),
        priceNoteInput
      ),
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Ghi chú địa điểm', attrs: { for: locationNoteId } }),
        locationNoteInput
      ),
      createEl('div', { className: 'field-group' },
        createEl('label', { className: 'field-label', text: 'Gia hạn số ngày còn lại (1 đến 14)', attrs: { for: expiryId } }),
        expiryInput
      ),
      editErr,
      createEl('div', { className: 'row-inline' }, saveBtn, cancelBtn)
    );

    editForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (saveBtn.disabled) {
        return;
      }
      const parsedQty = parseStrictNumber(qtyInput.value);
      const parsedDays = parseStrictInt(expiryInput.value);
      if (parsedQty === null || parsedQty <= 0) {
        editErr.textContent = 'Số lượng phải là số dương hợp lệ.';
        editErr.hidden = false;
        return;
      }
      if (parsedDays === null || parsedDays < 1 || parsedDays > 14) {
        editErr.textContent = 'Số ngày hết hạn phải là số nguyên từ 1 đến 14.';
        editErr.hidden = false;
        return;
      }
      saveBtn.disabled = true;
      editErr.hidden = true;
      try {
        await adminPatchListing(listing.id, {
          action: 'edit',
          category: categorySelect.value,
          rawQuantity: parsedQty,
          rawUnit: unitSelect.value,
          offerType: offerSelect.value,
          priceNote: priceNoteInput.value,
          locationNote: locationNoteInput.value,
          expiryDays: parsedDays
        });
        editingListingId = null;
        setStatus(`Đã cập nhật tin #${listing.id}.`, 'green');
        onListingsChanged();
        await reloadAdminListings();
      } catch (err) {
        if (err?.status === 401) {
          handleSessionExpired();
          return;
        }
        editErr.textContent = err?.message || 'Không thể cập nhật tin đăng.';
        editErr.hidden = false;
      } finally {
        saveBtn.disabled = false;
      }
    });

    return editForm;
  }

  function renderCropEditForm(crop) {
    const decayInput = createEl('input', {
      id: `admin-crop-decay-${crop.id}`,
      className: 'text-input',
      type: 'text',
      attrs: { inputmode: 'decimal' }
    });
    decayInput.value = String(crop.dailyDecayRate);

    const maxDaysInput = createEl('input', {
      id: `admin-crop-maxdays-${crop.id}`,
      className: 'text-input',
      type: 'text',
      attrs: { inputmode: 'numeric' }
    });
    maxDaysInput.value = String(crop.maxShelfLifeDays);

    const refPriceInput = createEl('input', {
      id: `admin-crop-price-${crop.id}`,
      className: 'text-input',
      type: 'text',
      attrs: { inputmode: 'numeric' }
    });
    refPriceInput.value = String(crop.referencePriceVnd);

    const cropErr = createEl('div', { className: 'notice-box notice-red', attrs: { hidden: true } });
    const saveBtn = createEl('button', { type: 'submit', className: 'btn btn-inline-primary', text: 'Lưu hệ số' });
    const cancelBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      text: 'Hủy',
      onClick: () => {
        editingCropId = null;
        renderUnlockedView();
      }
    });

    const cropForm = createEl('form', { className: 'sheet-section' },
      createEl('div', { className: 'filter-grid' },
        createEl('div', { className: 'field-group' },
          createEl('label', {
            className: 'field-label',
            text: 'Tỷ lệ hao hụt/ngày (0.001 đến 0.50)',
            attrs: { for: `admin-crop-decay-${crop.id}` }
          }),
          decayInput
        ),
        createEl('div', { className: 'field-group' },
          createEl('label', {
            className: 'field-label',
            text: 'Số ngày tươi tối đa (1 đến 365)',
            attrs: { for: `admin-crop-maxdays-${crop.id}` }
          }),
          maxDaysInput
        ),
        createEl('div', { className: 'field-group' },
          createEl('label', {
            className: 'field-label',
            text: 'Giá tham khảo (đ/kg)',
            attrs: { for: `admin-crop-price-${crop.id}` }
          }),
          refPriceInput
        )
      ),
      cropErr,
      createEl('div', { className: 'row-inline' }, saveBtn, cancelBtn)
    );

    cropForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (saveBtn.disabled) {
        return;
      }
      const parsedDecay = parseStrictNumber(decayInput.value);
      const parsedMaxDays = parseStrictInt(maxDaysInput.value);
      const parsedPrice = parseStrictInt(refPriceInput.value);

      if (parsedDecay === null || parsedMaxDays === null || parsedPrice === null) {
        cropErr.textContent = 'Vui lòng nhập các giá trị số hợp lệ.';
        cropErr.hidden = false;
        return;
      }

      saveBtn.disabled = true;
      cropErr.hidden = true;
      try {
        await adminPatchCrop(crop.id, {
          dailyDecayRate: parsedDecay,
          maxShelfLifeDays: parsedMaxDays,
          referencePriceVnd: parsedPrice
        });
        editingCropId = null;
        setStatus(`Đã cập nhật hệ số cho ${crop.name}.`, 'green');
        await onCropsChanged();
        renderUnlockedView();
      } catch (err) {
        if (err?.status === 401) {
          handleSessionExpired();
          return;
        }
        cropErr.textContent = err?.message || 'Không thể cập nhật hệ số nông sản.';
        cropErr.hidden = false;
      } finally {
        saveBtn.disabled = false;
      }
    });

    return cropForm;
  }

  function renderUnlockedView() {
    questionLead.textContent = 'Tin bị báo cáo, hệ số hoặc CSV?';
    bodyHost.replaceChildren();

    if (statusMessage) {
      bodyHost.appendChild(createEl('div', {
        className: `notice-box ${statusKind === 'red' ? 'notice-red' : 'notice-green'}`,
        text: statusMessage,
        attrs: { role: 'status' }
      }));
    }

    const exportBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-primary',
      text: 'Xuất bảng tính (CSV)',
      onClick: async () => {
        if (exportBtn.disabled) {
          return;
        }
        exportBtn.disabled = true;
        try {
          await downloadAdminCsv();
          setStatus('Đã tải tệp bảng tính agricircle-listings.csv.', 'green');
          renderUnlockedView();
        } catch (err) {
          if (err?.status === 401) {
            handleSessionExpired();
            return;
          }
          setStatus(err?.message || 'Không thể xuất bảng tính CSV.', 'red');
          renderUnlockedView();
        } finally {
          exportBtn.disabled = false;
        }
      }
    });

    const reloadBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-secondary',
      text: 'Làm mới danh sách',
      onClick: () => reloadAdminListings()
    });

    const logoutBtn = createEl('button', {
      type: 'button',
      className: 'btn btn-subtle',
      text: 'Đăng xuất',
      onClick: async () => {
        if (logoutBtn.disabled) {
          return;
        }
        logoutBtn.disabled = true;
        let logoutFailed = '';
        try {
          await adminLogout();
        } catch (err) {
          logoutFailed = err?.message || 'Không thể liên hệ máy chủ khi đăng xuất.';
        } finally {
          logoutBtn.disabled = false;
          adminListings = [];
          authState = 'locked';
          statusMessage = '';
          errorMessage = logoutFailed;
          editingListingId = null;
          editingCropId = null;
          renderLockedView();
        }
      }
    });

    bodyHost.appendChild(createEl('div', { className: 'surface-block' },
      exportBtn,
      createEl('div', { className: 'row-inline' }, reloadBtn, logoutBtn)
    ));

    const listingsSection = createEl('div', { className: 'section-block' },
      createEl('h2', {
        className: 'section-heading',
        text: `Kiểm duyệt tin đăng (${adminListings.length} tin, ưu tiên tin bị báo cáo)`
      })
    );

    if (adminListings.length === 0) {
      listingsSection.appendChild(createEl('p', {
        className: 'field-hint',
        text: 'Chưa có tin đăng nào trong hệ thống.'
      }));
    } else {
      const listWrap = createEl('div', { className: 'divider-list' });
      for (const item of adminListings) {
        const badge = getStatusBadge(item.status);
        const cat = getByproductCategoryById(item.category);
        const unit = getUnitById(item.rawUnit);
        const row = createEl('div', { className: 'divider-row' },
          createEl('div', { className: 'listing-top' },
            createEl('strong', { text: `#${item.id} - ${cat ? cat.name : item.category}` }),
            createEl('span', { className: badge.className, text: badge.text })
          ),
          createEl('p', {
            className: 'listing-note',
            text: `${formatViNumber(item.rawQuantity)} ${unit ? unit.shortLabel : item.rawUnit} (khoảng ${formatViNumber(item.estimatedKg, 1)} kg) - ${item.offerType === 'sell' ? 'Bán giá rẻ' : 'Cho miễn phí'}`
          }),
          createEl('p', {
            className: 'listing-meta-line',
            text: `Liên hệ: ${item.contactName} (${item.contactPhone}) - Báo cáo: ${item.reportCount}`
          })
        );
        if (item.locationNote) {
          row.appendChild(createEl('p', { className: 'listing-note', text: `Địa điểm: ${item.locationNote}` }));
        }
        if (item.priceNote) {
          row.appendChild(createEl('p', { className: 'listing-note', text: `Ghi chú giá: ${item.priceNote}` }));
        }
        if (item.rawVoiceText) {
          row.appendChild(createEl('p', { className: 'field-hint', text: `Câu nói gốc: ${item.rawVoiceText}` }));
        }

        const btnRow = createEl('div', { className: 'row-inline' });
        if (item.status === 'active' || item.status === 'reported') {
          const hideBtn = createEl('button', {
            type: 'button',
            className: 'btn btn-secondary',
            text: 'Ẩn tin',
            onClick: async () => {
              if (hideBtn.disabled) {
                return;
              }
              hideBtn.disabled = true;
              try {
                await adminPatchListing(item.id, { action: 'hide' });
                setStatus(`Đã ẩn tin #${item.id}.`, 'green');
                onListingsChanged();
                await reloadAdminListings();
              } catch (err) {
                if (err?.status === 401) {
                  handleSessionExpired();
                  return;
                }
                setStatus(err?.message || 'Không thể ẩn tin.', 'red');
                renderUnlockedView();
              } finally {
                hideBtn.disabled = false;
              }
            }
          });
          btnRow.appendChild(hideBtn);
        }

        if (item.status === 'reported' || item.status === 'hidden') {
          const restoreBtn = createEl('button', {
            type: 'button',
            className: 'btn btn-secondary',
            text: 'Khôi phục',
            onClick: async () => {
              if (restoreBtn.disabled) {
                return;
              }
              restoreBtn.disabled = true;
              try {
                const isExpired = item.expiresAt <= Date.now();
                const payload = isExpired ? { action: 'restore', expiryDays: 3 } : { action: 'restore' };
                await adminPatchListing(item.id, payload);
                setStatus(`Đã khôi phục tin #${item.id} và đặt lại lượt báo cáo về 0.`, 'green');
                onListingsChanged();
                await reloadAdminListings();
              } catch (err) {
                if (err?.status === 401) {
                  handleSessionExpired();
                  return;
                }
                setStatus(err?.message || 'Không thể khôi phục tin.', 'red');
                renderUnlockedView();
              } finally {
                restoreBtn.disabled = false;
              }
            }
          });
          btnRow.appendChild(restoreBtn);
        }

        if (item.status !== 'collected') {
          btnRow.appendChild(createEl('button', {
            type: 'button',
            className: 'btn btn-subtle',
            text: editingListingId === item.id ? 'Đang sửa...' : 'Sửa thông tin',
            onClick: () => {
              editingListingId = editingListingId === item.id ? null : item.id;
              renderUnlockedView();
            }
          }));
        } else {
          row.appendChild(createEl('p', {
            className: 'field-hint',
            text: 'Tin đã thu gom xong, không thể chỉnh sửa.'
          }));
        }

        if (btnRow.childNodes.length > 0) {
          row.appendChild(btnRow);
        }
        if (editingListingId === item.id && item.status !== 'collected') {
          row.appendChild(renderListingEditForm(item));
        }

        listWrap.appendChild(row);
      }
      listingsSection.appendChild(listWrap);
    }

    bodyHost.appendChild(listingsSection);

    const cropsSection = createEl('div', { className: 'section-block' },
      createEl('h2', { className: 'section-heading', text: 'Bảng hệ số hao hụt và giá tham khảo' })
    );
    const cropList = createEl('div', { className: 'divider-list' });
    for (const crop of getCrops()) {
      const cropRow = createEl('div', { className: 'divider-row' },
        createEl('div', { className: 'listing-top' },
          createEl('strong', { text: `${crop.icon} ${crop.name}` }),
          createEl('button', {
            type: 'button',
            className: 'btn btn-secondary',
            text: editingCropId === crop.id ? 'Đóng' : 'Chỉnh sửa',
            onClick: () => {
              editingCropId = editingCropId === crop.id ? null : crop.id;
              renderUnlockedView();
            }
          })
        ),
        createEl('p', {
          className: 'listing-meta-line',
          text: `Hao hụt: ${crop.dailyDecayRate} (${formatViNumber(crop.dailyDecayRate * 100, 1)}%/ngày) - Tối đa: ${crop.maxShelfLifeDays} ngày - Giá tham khảo: ${formatVnd(crop.referencePriceVnd)}`
        })
      );
      if (editingCropId === crop.id) {
        cropRow.appendChild(renderCropEditForm(crop));
      }
      cropList.appendChild(cropRow);
    }
    cropsSection.appendChild(cropList);
    bodyHost.appendChild(cropsSection);
  }

  function handleSessionExpired() {
    authState = 'locked';
    adminListings = [];
    editingListingId = null;
    editingCropId = null;
    errorMessage = 'Phiên quản trị đã hết hạn hoặc bị đăng xuất, vui lòng đăng nhập lại.';
    renderLockedView();
  }

  async function reloadAdminListings() {
    if (activeAbort) {
      activeAbort.abort();
    }
    const controller = new AbortController();
    activeAbort = controller;
    try {
      adminListings = await fetchAdminListings({ limit: 200, signal: controller.signal });
      if (activeAbort !== controller) {
        return;
      }
      renderUnlockedView();
    } catch (err) {
      if (isAbortError(err) || activeAbort !== controller) {
        return;
      }
      if (err?.status === 401) {
        handleSessionExpired();
        return;
      }
      if (err?.isOffline || err?.isNetworkError || !globalThis.navigator?.onLine) {
        authState = 'locked';
        offlineError = 'Chức năng Quản trị cần kết nối mạng trực tiếp tới máy chủ và không lưu bộ nhớ đệm ngoại tuyến.';
        renderLockedView();
        return;
      }
      if (err?.status === 503) {
        authState = 'locked';
        configError = err.message;
        renderLockedView();
        return;
      }
      setStatus(err?.message || 'Không thể tải danh sách quản trị.', 'red');
      renderUnlockedView();
    }
  }

  async function checkSessionAndLoad() {
    if (busy) {
      return;
    }
    if (activeAbort) {
      activeAbort.abort();
    }
    const controller = new AbortController();
    activeAbort = controller;
    busy = true;
    configError = '';
    offlineError = '';
    errorMessage = '';

    questionLead.textContent = 'Đang kiểm tra phiên quản trị...';
    bodyHost.replaceChildren(createEl('div', { className: 'surface-block' },
      createEl('p', { className: 'field-hint', text: 'Đang kết nối máy chủ...' })
    ));

    try {
      const items = await fetchAdminListings({ limit: 200, signal: controller.signal });
      if (activeAbort !== controller) {
        return;
      }
      adminListings = items;
      authState = 'unlocked';
      renderUnlockedView();
    } catch (err) {
      if (isAbortError(err) || activeAbort !== controller) {
        return;
      }
      authState = 'locked';
      if (err?.isNetworkError || err?.isOffline || !globalThis.navigator?.onLine) {
        offlineError = 'Chức năng Quản trị cần kết nối mạng trực tiếp tới máy chủ và không lưu bộ nhớ đệm ngoại tuyến.';
      } else if (err?.status === 503) {
        configError = err.message;
      } else if (err?.status === 401) {
        errorMessage = '';
      } else {
        errorMessage = err?.message || 'Không thể mở trang quản trị.';
      }
      renderLockedView();
    } finally {
      busy = false;
    }
  }

  return {
    onShow() {
      if (authState === 'unlocked' && globalThis.navigator?.onLine !== false) {
        reloadAdminListings();
      } else {
        checkSessionAndLoad();
      }
    },
    onConnectivityChanged(isOnline) {
      if (!isOnline && authState === 'unlocked') {
        offlineError = 'Mất kết nối mạng: Quản trị không hoạt động ngoại tuyến.';
        authState = 'locked';
        adminListings = [];
        renderLockedView();
      }
    }
  };
}
