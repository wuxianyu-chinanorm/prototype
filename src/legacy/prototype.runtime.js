// Auto-extracted from prototype-kis-v3.0-p01.html — migrate logic to React gradually.
(function () {
      var snackbar = document.getElementById("snackbar");
      var snackTimer;
      function toast(msg) {
        snackbar.textContent = msg;
        snackbar.classList.add("is-show");
        clearTimeout(snackTimer);
        snackTimer = setTimeout(function () {
          snackbar.classList.remove("is-show");
        }, 2800);
      }

      function normalizePhase(phase) {
        if (phase === "visit" || phase === "collect") return "visit-collect";
        return phase;
      }

      var phaseLabels = {
        schedule: "执行调度",
        prep: "立项准备",
        recruit: "招募预约",
        "visit-collect": "访视执行",
        quality: "质量审核",
        deliver: "交付归档",
        settings: "系统设置"
      };

      var planListShell = document.getElementById("plan-list-shell");
      var pagePlanDetail = document.getElementById("page-plan-detail");
      var currentRecruitView = "plans";

      function setRecruitSidebarActive(viewId) {
        document.querySelectorAll("#sidebar-nav-recruit [data-recruit-view]").forEach(function (btn) {
          var on = btn.getAttribute("data-recruit-view") === viewId;
          btn.classList.toggle("is-active", on);
          if (on) btn.setAttribute("aria-current", "page");
          else btn.removeAttribute("aria-current");
        });
      }

      function switchRecruitView(viewId, options) {
        options = options || {};
        if (!viewId) viewId = "plans";
        currentRecruitView = viewId;
        if (pagePlanDetail) pagePlanDetail.classList.add("is-hidden");
        document.querySelectorAll("[data-recruit-panel]").forEach(function (panel) {
          var on = panel.getAttribute("data-recruit-panel") === viewId;
          panel.classList.toggle("is-active", on);
        });
        if (planListShell) {
          if (viewId === "plans") {
            planListShell.classList.remove("is-hidden");
          } else {
            planListShell.classList.add("is-hidden");
          }
        }
        setRecruitSidebarActive(viewId);
        if (viewId === "appointments" && typeof renderApptCalendar === "function") {
          renderApptCalendar();
        }
        if (!options.skipPersist) persistNavState();
      }

      function showPlanListShell() {
        switchRecruitView("plans");
        if (planListShell) planListShell.classList.remove("is-hidden");
        if (pagePlanDetail) pagePlanDetail.classList.add("is-hidden");
      }

      function openPlanDetail(studyId, studyName, skipPersist) {
        if (planListShell) planListShell.classList.add("is-hidden");
        if (pagePlanDetail) pagePlanDetail.classList.remove("is-hidden");
        var sub = document.getElementById("plan-detail-subtitle");
        if (sub) sub.textContent = studyId + " · " + (studyName || "");
        if (!skipPersist) persistNavState();
      }

      function rowContextFrom(el) {
        var tr = el.closest("tr[data-study-id]");
        if (!tr) return null;
        return {
          studyId: tr.getAttribute("data-study-id"),
          studyName: tr.getAttribute("data-study-name")
        };
      }

      function updateNotifyBadge() {
        var badge = document.getElementById("notify-badge");
        if (!badge) return;
        var pending = document.querySelectorAll(
          ".notify-item[data-notify-go=\"inbound\"]:not([hidden])"
        ).length;
        if (pending > 0) {
          badge.textContent = String(pending);
          badge.hidden = false;
        } else {
          badge.hidden = true;
        }
        var headCount = document.querySelector(".notify-panel__head span:last-child");
        if (headCount) headCount.textContent = pending > 0 ? "入站待办 " + pending : "暂无待办";
      }

      function openInboundReviewForStudy(studyId) {
        showPlanListShell();
        var tr = planRowByStudyId(studyId);
        if (!tr) {
          toast("计划列表中未找到研究 " + studyId);
          return;
        }
        var studyName = tr.getAttribute("data-study-name") || "";
        if (tr.scrollIntoView) tr.scrollIntoView({ block: "nearest", behavior: "smooth" });
        var step = resolveOpenInboundStep(tr);
        openPlanDetailModal(studyId, studyName, step || undefined);
      }

      var btnPlanDetailBack = document.getElementById("btn-plan-detail-back");
      if (btnPlanDetailBack) {
        btnPlanDetailBack.addEventListener("click", function () {
          showPlanListShell();
        });
      }

      var pageRecruit = document.getElementById("page-recruit");
      var pagePrep = document.getElementById("page-prep");
      var currentPrepView = "study-chain";

      function setPrepSidebarActive(viewId) {
        document.querySelectorAll("#sidebar-nav-prep [data-prep-view]").forEach(function (btn) {
          var on = btn.getAttribute("data-prep-view") === viewId;
          btn.classList.toggle("is-active", on);
          if (on) btn.setAttribute("aria-current", "page");
          else btn.removeAttribute("aria-current");
        });
      }

      function switchPrepView(viewId, options) {
        options = options || {};
        if (!viewId) viewId = "study-chain";
        currentPrepView = viewId;
        document.querySelectorAll("[data-prep-panel]").forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-prep-panel") === viewId);
        });
        setPrepSidebarActive(viewId);
        if (!options.skipPersist) persistNavState();
      }

      var pageDeliver = document.getElementById("page-deliver");
      var pageSchedule = document.getElementById("page-schedule");
      var pagePlaceholder = document.getElementById("page-placeholder");
      var deliverDocTabs = document.getElementById("deliver-doc-tabs");
      var deliverFilterVisitWrap = document.getElementById("deliver-filter-visit-wrap");
      var deliverFilterSubjectWrap = document.getElementById("deliver-filter-subject-wrap");
      var deliverFilterScreenWrap = document.getElementById("deliver-filter-screen-wrap");
      var deliverFilterStudy = document.getElementById("deliver-filter-study");
      var deliverFilterScreen = document.getElementById("deliver-filter-screen");
      var deliverToolbarHint = document.getElementById("deliver-toolbar-hint");
      var currentDeliverView = "project-list";
      var visitArchiveFilterStudy = document.getElementById("vc-filter-study");
      var visitArchiveFilterScreen = document.getElementById("vc-filter-screen");
      var deliverVisitNavEl = document.getElementById("vc-visit-nav");
      var visitArchiveReadonlyMode = false;
      var visitArchiveEdcMode = "view";
      var deliverVisitUiState = {
        expandedVisitIds: {},
        selectedVisitId: null,
        selectedFormKey: null
      };

      var DELIVER_EDC_STEP_FORM = {
        签到: "sv-reg",
        知情: "icf",
        筛选入组: "ie",
        洁面: "prep",
        环境适应: "adapt",
        仪器评估: "instr",
        影像评估: "img",
        功效评估: "ga",
        自评问卷: "pro",
        产品: "prod",
        日记: "diary",
        操作: "misc",
        签出: "sv-out"
      };

      function deliverEdcFormIdForStep(stepLabel) {
        return DELIVER_EDC_STEP_FORM[stepLabel] || "misc";
      }

      function deliverEdcFormKey(visitId, formId) {
        return visitId + ":" + formId;
      }

      /** eCRF 表单定义（归档只读 · 借鉴 EDC 表单 OID / 分组 / 字段） */
      var DELIVER_EDC_FORM_DEFS = {
        "sv-reg": {
          oid: "FORM.SV01",
          title: "到访登记",
          version: "CRF v3.2",
          sections: [
            {
              title: "到访信息",
              fields: [
                { oid: "SV.VISITDT", label: "实际到访日期", value: "{{visitDate}}" },
                { oid: "SV.CHECKIN", label: "签到时间", value: "{{checkinTime}}" },
                { oid: "SV.SITE", label: "中心", value: "01 · 上海临床中心" },
                { oid: "SV.VISIT", label: "访视编码", value: "{{visitCode}}" }
              ]
            },
            {
              title: "身份核对",
              fields: [
                { oid: "SV.SUBJID", label: "筛选号", value: "{{screenId}}" },
                { oid: "SV.RD", label: "随机号", value: "{{rd}}" },
                { oid: "SV.INIT", label: "姓名缩写", value: "{{initials}}" }
              ]
            }
          ]
        },
        icf: {
          oid: "FORM.ICF",
          title: "知情同意",
          version: "IC-v3",
          sections: [
            {
              title: "签署",
              fields: [
                { oid: "ICF.VERSION", label: "知情版本", value: "IC-v3 · 2026-02-15" },
                { oid: "ICF.CONSENTDT", label: "签署日期", value: "{{visitDate}}" },
                { oid: "ICF.METHOD", label: "签署方式", value: "电子签（平板）" },
                { oid: "ICF.WITNESS", label: "见证人", value: "李 CRC" }
              ]
            }
          ]
        },
        ie: {
          oid: "FORM.IE",
          title: "入排标准 / 筛选结论",
          version: "CRF v3.2",
          sections: [
            {
              title: "入排核对",
              fields: [
                { oid: "IE.IN01", label: "年龄 18–55 岁", value: "是" },
                { oid: "IE.IN02", label: "自愿签署知情", value: "是" },
                { oid: "IE.EX03", label: "近 4 周使用同类功效产品", value: "否" }
              ]
            },
            {
              title: "结论",
              fields: [
                { oid: "IE.ELIG", label: "是否符合入排", value: "是" },
                { oid: "IE.ENR", label: "是否纳入测试", value: "{{enrollText}}" },
                { oid: "IE.SCRID", label: "筛选记录编号", value: "{{scrRecord}}" }
              ]
            }
          ]
        },
        prep: {
          oid: "FORM.PREP",
          title: "访前准备（洁面 / 平衡）",
          version: "CRF v3.2",
          sections: [
            {
              title: "操作记录",
              fields: [
                { oid: "PREP.WASH", label: "标准洁面完成", value: "是" },
                { oid: "PREP.EQUIL", label: "环境平衡开始时间", value: "{{equilStart}}" },
                { oid: "PREP.EQUILMIN", label: "平衡时长（min）", value: "30" },
                { oid: "PREP.ROOM", label: "测量房间", value: "A2 · TEWL 达标" }
              ]
            }
          ]
        },
        adapt: {
          oid: "FORM.ADAPT",
          title: "环境适应",
          version: "CRF v3.2",
          sections: [
            {
              title: "适应",
              fields: [
                { oid: "ADP.DONE", label: "受试者已适应测量环境", value: "是" },
                { oid: "ADP.NOTE", label: "备注", value: "—" }
              ]
            }
          ]
        },
        instr: {
          oid: "FORM.CM",
          title: "仪器测量",
          version: "CRF v3.2",
          sections: [
            {
              title: "Corneometer · 左颊",
              fields: [
                { oid: "CM.LCHEEK1", label: "测量值 1", value: "{{cm1}}", unit: "AU" },
                { oid: "CM.LCHEEK2", label: "测量值 2", value: "{{cm2}}", unit: "AU" },
                { oid: "CM.LCHEEK3", label: "测量值 3", value: "{{cm3}}", unit: "AU" },
                { oid: "CM.LCHEEKM", label: "平均值", value: "{{cmAvg}}", unit: "AU" }
              ]
            },
            {
              title: "Cutometer · 左颊",
              fields: [
                { oid: "CU.R2", label: "R2", value: "{{cutoR2}}" },
                { oid: "CU.Q", label: "Q 值", value: "{{cutoQ}}" }
              ]
            }
          ]
        },
        img: {
          oid: "FORM.IMG",
          title: "影像采集",
          version: "CRF v3.2",
          sections: [
            {
              title: "VISIA / 标准光",
              fields: [
                { oid: "IMG.DEVICE", label: "设备", value: "VISIA-CR · #V-018" },
                { oid: "IMG.FRONT", label: "正面原始图", value: "IMG-{{visitShort}}-F001.dcm · 已入库" },
                { oid: "IMG.LCHEEK", label: "左颊 ROI", value: "IMG-{{visitShort}}-L001.dcm · 已入库" },
                { oid: "IMG.QC", label: "影像 QC", value: "通过" }
              ]
            }
          ]
        },
        ga: {
          oid: "FORM.GA",
          title: "功效评估（专家临床）",
          version: "CRF v3.2",
          sections: [
            {
              title: "皮肤科医生评估",
              fields: [
                { oid: "GA.HYDR", label: "hydration 评分（0–9）", value: "{{gaHydr}}" },
                { oid: "GA.TEX", label: "纹理评分（0–9）", value: "{{gaTex}}" },
                { oid: "GA.AE", label: "是否存在 AE", value: "否" }
              ]
            }
          ]
        },
        pro: {
          oid: "FORM.PRO",
          title: "受试者自评问卷",
          version: "PRO-v2",
          sections: [
            {
              title: "主观感受",
              fields: [
                { oid: "PRO.DRY", label: "干燥感 VAS", value: "{{proDry}}" },
                { oid: "PRO.ITCH", label: "瘙痒感 VAS", value: "{{proItch}}" },
                { oid: "PRO.SAT", label: "整体满意度", value: "{{proSat}}" }
              ]
            }
          ]
        },
        prod: {
          oid: "FORM.PROD",
          title: "产品发放 / 回收",
          version: "CRF v3.2",
          sections: [
            {
              title: "样品",
              fields: [
                { oid: "PROD.KIT", label: "发放 kit 号", value: "KIT-8842-A" },
                { oid: "PROD.LOT", label: "批号", value: "L20260301" },
                { oid: "PROD.WT", label: "发放称重（g）", value: "{{prodWt}}" },
                { oid: "PROD.CHK", label: "外观检查", value: "正常" }
              ]
            }
          ]
        },
        diary: {
          oid: "FORM.DIARY",
          title: "日记",
          version: "DIARY-v1",
          sections: [
            {
              title: "依从性",
              fields: [
                { oid: "DIA.PERIOD", label: "覆盖周期", value: "{{diaryPeriod}}" },
                { oid: "DIA.RATE", label: "填报完整率", value: "{{diaryRate}}" },
                { oid: "DIA.MISS", label: "缺失天数", value: "{{diaryMiss}}" }
              ]
            }
          ]
        },
        misc: {
          oid: "FORM.MISC",
          title: "现场操作记录",
          version: "CRF v3.2",
          sections: [
            {
              title: "其他操作",
              fields: [
                { oid: "MISC.DESC", label: "操作说明", value: "照灯 / 撕贴等方案规定步骤" },
                { oid: "MISC.DONE", label: "是否完成", value: "是" }
              ]
            }
          ]
        },
        "sv-out": {
          oid: "FORM.SVOUT",
          title: "访视结束 / 签出",
          version: "CRF v3.2",
          sections: [
            {
              title: "签出",
              fields: [
                { oid: "OUT.TIME", label: "签出时间", value: "{{checkoutTime}}" },
                { oid: "OUT.NEXT", label: "下次访视计划", value: "{{nextVisit}}" },
                { oid: "OUT.CRC", label: "确认 CRC", value: "王 CRC" }
              ]
            }
          ]
        }
      };

      var DELIVER_EDC_VISIT_VARS = {
        v0: {
          visitCode: "V0",
          visitShort: "V0",
          checkinTime: "08:55",
          checkoutTime: "12:40",
          equilStart: "09:35",
          enrollText: "是 · 发 RD-8842",
          scrRecord: "SCR-2026-0303-018",
          cm1: "52.1",
          cm2: "51.8",
          cm3: "52.4",
          cmAvg: "52.1",
          cutoR2: "0.72",
          cutoQ: "0.41",
          gaHydr: "6",
          gaTex: "5",
          proDry: "42",
          proItch: "18",
          proSat: "满意",
          prodWt: "—",
          diaryPeriod: "—",
          diaryRate: "—",
          diaryMiss: "—",
          nextVisit: "V1 · 2026-03-10"
        },
        v1: {
          visitCode: "V1",
          visitShort: "V1",
          checkinTime: "09:02",
          checkoutTime: "16:18",
          equilStart: "09:25",
          enrollText: "—",
          scrRecord: "—",
          cm1: "58.3",
          cm2: "57.9",
          cm3: "58.1",
          cmAvg: "58.1",
          cutoR2: "0.78",
          cutoQ: "0.45",
          gaHydr: "7",
          gaTex: "6",
          proDry: "28",
          proItch: "12",
          proSat: "满意",
          prodWt: "45.2",
          diaryPeriod: "D1–D7",
          diaryRate: "100%",
          diaryMiss: "0",
          nextVisit: "V2 · 2026-03-17"
        },
        v2: {
          visitCode: "V2",
          visitShort: "V2",
          checkinTime: "13:10",
          checkoutTime: "17:05",
          equilStart: "13:28",
          enrollText: "—",
          scrRecord: "—",
          cm1: "61.2",
          cm2: "60.8",
          cm3: "61.0",
          cmAvg: "61.0",
          cutoR2: "0.81",
          cutoQ: "0.48",
          gaHydr: "7",
          gaTex: "6",
          proDry: "22",
          proItch: "10",
          proSat: "非常满意",
          prodWt: "38.6",
          diaryPeriod: "D8–D14",
          diaryRate: "86%",
          diaryMiss: "1",
          nextVisit: "V3 · 2026-03-31"
        },
        v3: {
          visitCode: "V3",
          visitShort: "V3",
          checkinTime: "08:48",
          checkoutTime: "15:22",
          equilStart: "09:05",
          enrollText: "—",
          scrRecord: "—",
          cm1: "59.7",
          cm2: "59.4",
          cm3: "59.8",
          cmAvg: "59.6",
          cutoR2: "0.79",
          cutoQ: "0.46",
          gaHydr: "7",
          gaTex: "6",
          proDry: "20",
          proItch: "8",
          proSat: "非常满意",
          prodWt: "回收 12.1g",
          diaryPeriod: "D15–D28",
          diaryRate: "100%",
          diaryMiss: "0",
          nextVisit: "— · 研究结束"
        }
      };

      function deliverVisitIsExpanded(visitId) {
        return !!deliverVisitUiState.expandedVisitIds[visitId];
      }

      function deliverVisitToggleExpanded(visitId) {
        deliverVisitUiState.expandedVisitIds[visitId] = !deliverVisitUiState.expandedVisitIds[visitId];
      }

      function deliverVisitEnsureExpandedDefaults(visits, expandAll) {
        if (!visits || !visits.length) return;
        var any = false;
        visits.forEach(function (v) {
          if (deliverVisitUiState.expandedVisitIds[v.id]) any = true;
        });
        if (!any || expandAll) {
          visits.forEach(function (v) {
            deliverVisitUiState.expandedVisitIds[v.id] = true;
          });
        }
      }

      var deliverViewMeta = {
        "project-list": {
          title: "项目列表",
          subtitle: "按项目查看交付就绪状态 · 侧栏「项目归档台」",
          mode: "project"
        },
        completeness: {
          title: "完整性概览",
          subtitle: "受试者 × 资料模块矩阵 · 发现缺口后跳转受试者资料台",
          mode: "project"
        },
        "delivery-batch": {
          title: "交付批次",
          subtitle: "历史导出包与签收状态 · 与交付作业台联动",
          mode: "project"
        },
        "subject-search": {
          title: "受试者检索",
          subtitle: "项目 + 访视 + 受试者 · 下方 Tab 切换资料类型（只读归档）",
          mode: "subject"
        },
        "subject-timeline": {
          title: "资料时间线",
          subtitle: "单受试者全链路事件 · 与资料 Tab 过滤联动（示意）",
          mode: "subject"
        },
        "missing-list": {
          title: "缺失清单",
          subtitle: "按项目汇总未齐套项 · 可回链采集 / 质控阶段补录",
          mode: "subject"
        },
        "pack-export": {
          title: "打包导出",
          subtitle: "生成申办方 / 监管包 · 侧栏「交付作业台」",
          mode: "ops"
        },
        signoff: {
          title: "签收确认",
          subtitle: "外部接收方对交付批次的确认留痕",
          mode: "ops"
        },
        "archive-lock": {
          title: "归档锁定",
          subtitle: "项目 / 访视范围锁定 · 锁定后仅交付归档只读浏览",
          mode: "ops"
        }
      };

      var deliverDocLabels = {
        consent: "知情",
        questionnaire: "问卷 / 日记",
        ecrf: "eCRF",
        source: "源数据 / 附件",
        query: "质疑 / 关闭"
      };

      function setDeliverSidebarActive(viewId) {
        document.querySelectorAll("#sidebar-nav-deliver [data-deliver-view]").forEach(function (btn) {
          var on = btn.getAttribute("data-deliver-view") === viewId;
          btn.classList.toggle("is-active", on);
          if (on) btn.setAttribute("aria-current", "page");
          else btn.removeAttribute("aria-current");
        });
      }

      function updateDeliverDocPreview(docKey) {
        var label = deliverDocLabels[docKey] || docKey;
        var text =
          "当前资料 Tab：<strong>" +
          label +
          "</strong> — 展示该受试者已锁定归档副本（版本号 / 签署或提交时间 / 质疑状态为示意字段）。";
        ["deliver-doc-preview-subject-search", "deliver-doc-preview-subject-timeline"].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.innerHTML = text;
        });
      }

      function switchDeliverView(viewId, options) {
        options = options || {};
        if (!deliverViewMeta[viewId]) return;
        currentDeliverView = viewId;
        var meta = deliverViewMeta[viewId];
        var titleEl = document.getElementById("deliver-page-title");
        var subEl = document.getElementById("deliver-page-subtitle");
        if (titleEl) titleEl.textContent = meta.title;
        if (subEl) subEl.textContent = meta.subtitle;
        document.querySelectorAll("[data-deliver-panel]").forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-deliver-panel") === viewId);
        });
        var isSubject = meta.mode === "subject";
        if (deliverFilterVisitWrap) deliverFilterVisitWrap.hidden = !isSubject;
        if (deliverFilterSubjectWrap) deliverFilterSubjectWrap.hidden = !isSubject;
        if (deliverFilterScreenWrap) deliverFilterScreenWrap.hidden = true;
        if (deliverDocTabs) deliverDocTabs.hidden = !isSubject;
        if (deliverToolbarHint) {
          if (meta.mode === "project") {
            deliverToolbarHint.textContent =
              "项目视角：选择项目后查看列表、完整性矩阵或交付批次；单元格可下钻到受试者时间线。";
          } else if (meta.mode === "subject") {
            deliverToolbarHint.textContent =
              "受试者视角：项目 + 访视 + 筛选号定位单人，资料 Tab 切换知情 / 问卷 / eCRF / 源数据 / 质疑（只读）。";
          } else {
            deliverToolbarHint.textContent =
              "作业视角：与浏览解耦，面向 PM / DM 的导出、签收、锁定操作（不替代资料 Tab 浏览）。";
          }
        }
        setDeliverSidebarActive(viewId);
        if (isSubject) {
          var activeDoc = deliverDocTabs
            ? deliverDocTabs.querySelector("[data-deliver-doc].is-active")
            : null;
          updateDeliverDocPreview(
            activeDoc ? activeDoc.getAttribute("data-deliver-doc") : "consent"
          );
        }
        if (!options.skipPersist) persistNavState();
      }

      function openVisitCollectArchive(options) {
        options = options || {};
        visitArchiveReadonlyMode = !!options.readonly;
        if (options.presetStudy && visitArchiveFilterStudy) {
          visitArchiveFilterStudy.value = options.presetStudy;
        }
        activatePhase("visit-collect", { skipPersist: true, preserveReadonlyMode: true });
        switchVisitCollectView("crf-work", { skipPersist: true });
        var titleEl = document.getElementById("vc-page-title");
        var subEl = document.getElementById("vc-page-subtitle");
        var modeBar = document.getElementById("vc-edc-mode-bar");
        if (visitArchiveReadonlyMode) {
          if (titleEl) titleEl.textContent = "访视档案（只读副本）";
          if (subEl) {
            subEl.textContent =
              "交付归档视角 · 与「访视 CRF 作业台」同源 · 仅查看（原型示意）";
          }
          if (modeBar) modeBar.hidden = true;
          visitArchiveEdcMode = "view";
        } else {
          if (titleEl) titleEl.textContent = "访视 CRF 作业台";
          if (subEl) {
            subEl.textContent =
              "eCRF 作业 · 支持查看 / 编辑 / 质疑 · 左侧访视树 · 右侧 CRF 表单";
          }
          if (modeBar) modeBar.hidden = false;
        }
        deliverVisitUiState.selectedVisitId = null;
        deliverVisitUiState.selectedFormKey = null;
        deliverVisitUiState.expandedVisitIds = {};
        renderDeliverVisitArchive({
          expandAllVisits: !!options.expandAllVisits,
          resetForm: true
        });
        persistNavState();
      }

      /** 4 周 4 访视示例 · 流程步对齐工作台规划 v0.8「单次到访全流程」 */
      var DELIVER_VISIT_FLOW_TAIL = [
        { num: "5.4", label: "洁面", desk: "受试者 / 操作台", prd: 9 },
        { num: "5.5", label: "环境适应", desk: "受试者", prd: 9 },
        { num: "5.6", label: "仪器评估", desk: "仪器测量台", prd: 11 },
        { num: "5.7", label: "影像评估", desk: "影像评估台", prd: 12 },
        { num: "5.8", label: "功效评估", desk: "功效评估台", prd: 10 },
        { num: "5.9", label: "自评问卷", desk: "功效评估台", prd: 13 },
        { num: "5.10", label: "产品", desk: "操作台", prd: 14 },
        { num: "5.11", label: "日记", desk: "功效评估台", prd: 15 },
        { num: "5.12", label: "操作", desk: "操作台 + 受试者", prd: 9 },
        { num: "5.13", label: "签出", desk: "操作台", prd: 6 }
      ];

      function deliverVisitFlowForType(visitType, options) {
        options = options || {};
        var head =
          visitType === "screen"
            ? [
                { num: "5.1", label: "签到", desk: "筛选台 + 操作台", prd: 6, screenOnly: false },
                { num: "5.2", label: "知情", desk: "筛选台", prd: 7, screenOnly: true },
                { num: "5.3", label: "筛选入组", desk: "筛选台 + 测量/影像", prd: 8, screenOnly: true }
              ]
            : [{ num: "5.1", label: "签到", desk: "操作台", prd: 6, followNote: "回访轻核 + 时点核对" }];
        var tail = DELIVER_VISIT_FLOW_TAIL.slice();
        if (options.trimProduct) {
          tail = tail.filter(function (s) {
            return s.label !== "产品" && s.label !== "日记";
          });
        }
        return head.concat(tail);
      }

      var DELIVER_VISIT_ARCHIVE_DEMO = {
        H26104001: {
          name: "4周4访视保湿验证（示例）",
          window: "2026-03-03 → 2026-03-31（4 周 · 4 次到访）",
          chain: [
            { phase: "立项准备", detail: "方案 V1.0 · 4 访视点 · 评估项发布" },
            { phase: "执行调度", detail: "排期 W0/W1/W2/W4 · 房间/仪器工单" },
            { phase: "招募预约", detail: "公开报名 → 预约 V0 筛选" },
            { phase: "到访筛选", detail: "V0 知情 + 入组判定" },
            { phase: "采集提交", detail: "V1–V3 仪器/影像/功效/问卷" },
            { phase: "交付归档", detail: "本页 · 只读副本齐套" }
          ],
          chainNote:
            "受试者 SC-2603-018：V0 筛选通过后发 RD-8842；V1 基线（W1）起进入 4 周测试期，V3（W4）终访归档锁定。筛选访视与回访访视的测试流程差异体现在左侧展开项（知情/筛选入组仅 V0）。",
          subjects: {
            "SC-2603-018": {
              rd: "RD-8842",
              initials: "Z.L.",
              visits: [
                {
                  id: "v0",
                  label: "V0 筛选访视",
                  plan: "W0 · Day 0",
                  date: "2026-03-03",
                  type: "screen",
                  status: "已归档",
                  outcome: "入组 · 发 RD-8842"
                },
                {
                  id: "v1",
                  label: "V1 基线",
                  plan: "W1 · Day 7",
                  date: "2026-03-10",
                  type: "follow",
                  status: "已归档",
                  outcome: "基线采集齐套"
                },
                {
                  id: "v2",
                  label: "V2 中期随访",
                  plan: "W2 · Day 14",
                  date: "2026-03-17",
                  type: "follow",
                  status: "已归档",
                  outcome: "中期评估完成"
                },
                {
                  id: "v3",
                  label: "V3 终访",
                  plan: "W4 · Day 28",
                  date: "2026-03-31",
                  type: "follow",
                  status: "已归档",
                  outcome: "终访 + 产品回收",
                  trimProduct: false
                }
              ],
              traceByVisit: {
                v0: [
                  {
                    stage: "立项准备 · 配置发布台",
                    action: "eCRF / 知情 / 入排模板 V3 已发布",
                    key: "配置定稿版本 CFG-2026-02-20"
                  },
                  {
                    stage: "执行调度台",
                    action: "V0 筛选场次 · 房间 A2 · Corneometer 预留",
                    key: "工单 SCH-2026-0303-V0"
                  },
                  {
                    stage: "招募预约台",
                    action: "预约到院 · 报名 B-99102 关联",
                    key: "受试者编号 SUB-660018"
                  },
                  {
                    stage: "筛选入组台",
                    action: "知情签署 → 病史 → 入排 → 纳入测试",
                    key: "筛选记录 SCR-2026-0303-018"
                  },
                  {
                    stage: "采集提交",
                    action: "筛选期仪器 + 影像 + 功效（同次到访）",
                    key: "Task 包 TPK-SCREEN-018"
                  }
                ],
                v1: [
                  {
                    stage: "执行调度台",
                    action: "V1 基线排期 · 导检队列 #12",
                    key: "工单 SCH-2026-0310-V1"
                  },
                  {
                    stage: "访视操作台",
                    action: "签到 → 洁面平衡 → 任务派发 → 产品发放",
                    key: "访视任务单 VT-2026-0310-8842"
                  },
                  {
                    stage: "仪器 / 影像 / 功效",
                    action: "Corneometer · VISIA · 专家评分 + 自评",
                    key: "测量/影像/CRF 已锁定"
                  }
                ],
                v2: [
                  {
                    stage: "执行调度台",
                    action: "V2 中期 · 与 V1 同模板窗口 ±1 天",
                    key: "工单 SCH-2026-0317-V2"
                  },
                  {
                    stage: "访视操作台",
                    action: "回访签到 · 产品称重 · 任务派发",
                    key: "VT-2026-0317-8842"
                  },
                  {
                    stage: "采集提交",
                    action: "仪器 + 影像 + 第 14 日日记回传",
                    key: "问卷_日记填报记录 D14"
                  }
                ],
                v3: [
                  {
                    stage: "执行调度台",
                    action: "V3 终访 · 产品回收称重",
                    key: "工单 SCH-2026-0331-V3"
                  },
                  {
                    stage: "访视操作台",
                    action: "终访签到 → 采集 → 产品回收/检查 → 签出",
                    key: "VT-2026-0331-8842"
                  },
                  {
                    stage: "质量审核 → 交付归档",
                    action: "数据锁定后进入本页只读浏览",
                    key: "锁定批次 LCK-2026-0331"
                  }
                ]
              }
            }
          }
        }
      };

      function getDeliverVisitArchiveContext() {
        var studyId =
          visitArchiveFilterStudy && visitArchiveFilterStudy.value !== "all"
            ? visitArchiveFilterStudy.value
            : "H26104001";
        var study = DELIVER_VISIT_ARCHIVE_DEMO[studyId];
        if (!study) return null;
        var screenId = visitArchiveFilterScreen ? visitArchiveFilterScreen.value : "";
        var subject = study.subjects[screenId];
        if (!subject) {
          var keys = Object.keys(study.subjects);
          screenId = keys[0];
          subject = study.subjects[screenId];
        }
        return { studyId: studyId, study: study, screenId: screenId, subject: subject };
      }

      function deliverEdcInterpolate(text, vars, ctx, visit) {
        if (!text) return "";
        var map = {
          visitDate: visit.date,
          screenId: ctx.screenId,
          rd: ctx.subject.rd,
          initials: ctx.subject.initials
        };
        for (var k in vars) {
          if (Object.prototype.hasOwnProperty.call(vars, k)) map[k] = vars[k];
        }
        return text.replace(/\{\{(\w+)\}\}/g, function (_, key) {
          return map[key] != null && map[key] !== "" ? map[key] : "—";
        });
      }

      function deliverEdcSidebarFormLabel(formId, stepLabel) {
        var def = DELIVER_EDC_FORM_DEFS[formId];
        if (!def) return stepLabel;
        return def.title + " · " + def.oid;
      }

      function deliverEdcResolveSelection(ctx, visits) {
        var visitId = deliverVisitUiState.selectedVisitId;
        var visit = visits.filter(function (v) {
          return v.id === visitId;
        })[0];
        if (!visit) visit = visits[0];
        visitId = visit.id;
        deliverVisitUiState.selectedVisitId = visitId;

        var flow = deliverVisitFlowForType(visit.type, { trimProduct: visit.trimProduct });
        var formKey = deliverVisitUiState.selectedFormKey;
        var formId = null;
        var step = null;
        if (formKey && formKey.indexOf(visitId + ":") === 0) {
          formId = formKey.split(":")[1];
          step = flow.filter(function (s) {
            return deliverEdcFormIdForStep(s.label) === formId;
          })[0];
        }
        if (!formId || !step) {
          step = flow[0];
          formId = deliverEdcFormIdForStep(step.label);
          deliverVisitUiState.selectedFormKey = deliverEdcFormKey(visitId, formId);
        }
        return { visit: visit, step: step, formId: formId };
      }

      function renderDeliverEdcForm(ctx, visit, formId, step) {
        var root = document.getElementById("vc-edc-root");
        if (!root) return;
        var readonly = visitArchiveReadonlyMode;
        var mode = readonly ? "view" : visitArchiveEdcMode || "view";
        var def = DELIVER_EDC_FORM_DEFS[formId] || DELIVER_EDC_FORM_DEFS.misc;
        var vars = DELIVER_EDC_VISIT_VARS[visit.id] || {};
        var hasQuery = formId === "ga" && visit.id === "v1";

        var sectionsHtml = (def.sections || [])
          .map(function (sec) {
            var rows = (sec.fields || [])
              .map(function (f) {
                var val = deliverEdcInterpolate(f.value, vars, ctx, visit);
                var empty = !val || val === "—";
                var unit = f.unit ? ' <span style="color:#64748b;font-weight:400">' + f.unit + "</span>" : "";
                var closedQ =
                  hasQuery && f.oid === "GA.HYDR" && (mode === "view" || readonly)
                    ? '<span class="edc-field-query" title="已关闭 · 归档副本">Q1</span>'
                    : "";
                var openQ =
                  mode === "query" && !readonly
                    ? '<button type="button" class="edc-field-query-btn" data-edc-query-stub="' +
                      f.oid +
                      '">质疑</button>'
                    : "";
                var editable = mode === "edit" && !readonly && !empty;
                return (
                  "<tr><th>" +
                  f.label +
                  '<span class="edc-field-oid">' +
                  f.oid +
                  "</span></th><td>" +
                  '<span class="edc-field-value' +
                  (empty ? " is-empty" : "") +
                  (editable ? " is-editable" : "") +
                  '"' +
                  (editable ? ' contenteditable="true"' : "") +
                  ">" +
                  (empty ? "未填写" : val) +
                  "</span>" +
                  unit +
                  closedQ +
                  openQ +
                  "</td></tr>"
                );
              })
              .join("");
            return (
              '<div class="edc-section"><h3 class="edc-section__title">' +
              sec.title +
              '</h3><table class="edc-field-table"><tbody>' +
              rows +
              "</tbody></table></div>"
            );
          })
          .join("");

        root.innerHTML =
          '<div class="edc-archive-toolbar">' +
          '<div><div class="edc-archive-toolbar__subject">' +
          ctx.screenId +
          " · " +
          ctx.subject.rd +
          " · " +
          visit.label +
          '</div><div class="edc-archive-toolbar__meta">' +
          ctx.studyId +
          " · " +
          ctx.study.name +
          " · 到访 " +
          visit.date +
          "</div></div>" +
          '<div class="edc-archive-toolbar__badges">' +
          (readonly
            ? '<span class="edc-badge edc-badge--readonly">只读归档</span><span class="edc-badge edc-badge--locked">已锁定</span>'
            : mode === "view"
              ? '<span class="edc-badge edc-badge--readonly">查看</span>'
              : mode === "edit"
                ? '<span class="edc-badge edc-badge--draft">编辑中</span>'
                : '<span class="edc-badge edc-badge--query">质疑</span>') +
          (hasQuery && (readonly || mode === "view")
            ? '<span class="edc-badge edc-badge--query">质疑已关闭</span>'
            : "") +
          "</div></div>" +
          '<div class="edc-form-head"><h2>' +
          def.title +
          "</h2><p>" +
          def.oid +
          " · " +
          def.version +
          " · 流程节点 " +
          step.num +
          " " +
          step.label +
          (readonly
            ? " · 采集台落库后同步至交付归档（字段级审计可追溯）"
            : " · 与到访筛选 / 采集提交台同源 · 保存后进入质量审核与交付归档") +
          "</p></div>" +
          '<div class="edc-form-body">' +
          sectionsHtml +
          "</div>" +
          '<div class="edc-form-foot">' +
          (readonly
            ? "最后更新：" +
              visit.date +
              " 16:20 · 锁定批次 LCK-2026-0331 · 本页不提供编辑/保存（EDC 归档浏览）"
            : mode === "edit"
              ? "最后保存：" +
                visit.date +
                ' 16:20 · 操作人 付华琴 · <button type="button" class="btn btn--text" data-edc-save-stub>保存草稿</button> · <button type="button" class="btn btn--primary" data-edc-submit-stub>提交</button>'
              : mode === "query"
                ? "质疑模式：点击字段旁「质疑」发起 Query · 关闭后同步 DM 与归档副本（原型示意）"
                : "查看模式：字段只读 · 切换「编辑」可改值 · 切换「质疑」可发起 Query") +
          "</div>";

        root.querySelectorAll("[data-edc-query-stub]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            toast("已发起质疑 · " + btn.getAttribute("data-edc-query-stub") + "（原型示意）");
          });
        });
        var saveStub = root.querySelector("[data-edc-save-stub]");
        if (saveStub) {
          saveStub.addEventListener("click", function () {
            toast("CRF 草稿已保存（原型示意）");
          });
        }
        var submitStub = root.querySelector("[data-edc-submit-stub]");
        if (submitStub) {
          submitStub.addEventListener("click", function () {
            toast("CRF 已提交 · 进入审核轨（原型示意）");
          });
        }
      }

      function setVisitArchiveEdcMode(mode) {
        if (visitArchiveReadonlyMode) return;
        if (mode !== "view" && mode !== "edit" && mode !== "query") mode = "view";
        visitArchiveEdcMode = mode;
        var bar = document.getElementById("vc-edc-mode-bar");
        if (bar) {
          bar.querySelectorAll("[data-edc-mode]").forEach(function (btn) {
            var on = btn.getAttribute("data-edc-mode") === mode;
            btn.classList.toggle("is-active", on);
          });
        }
        var hint = document.getElementById("vc-edc-mode-hint");
        if (hint) {
          if (mode === "edit") hint.textContent = "可修改高亮字段 · 保存草稿或提交";
          else if (mode === "query") hint.textContent = "对字段发起质疑 · DM 关闭后留痕";
          else hint.textContent = "只读浏览字段与审计信息";
        }
        renderDeliverVisitArchive();
      }

      function renderDeliverVisitMainNav(ctx) {
        if (!deliverVisitNavEl || !ctx) {
          if (deliverVisitNavEl) deliverVisitNavEl.innerHTML = "";
          return;
        }
        var visits = ctx.subject.visits;
        var activeFormKey = deliverVisitUiState.selectedFormKey;
        deliverVisitNavEl.innerHTML =
          '<div class="deliver-visit-nav__head">访视时间点 · ' +
          ctx.studyId +
          "</div>" +
          visits
            .map(function (v) {
              var flow = deliverVisitFlowForType(v.type, { trimProduct: v.trimProduct });
              var isExp = deliverVisitIsExpanded(v.id);
              var isSel = deliverVisitUiState.selectedVisitId === v.id;
              var stepsHtml = flow
                .map(function (step) {
                  var formId = deliverEdcFormIdForStep(step.label);
                  var fKey = deliverEdcFormKey(v.id, formId);
                  var on = activeFormKey === fKey;
                  var tag = step.screenOnly
                    ? '<span class="deliver-visit-flow-step__tag is-screen-only">仅筛选</span>'
                    : "";
                  var formLabel = deliverEdcSidebarFormLabel(formId, step.label);
                  return (
                    '<button type="button" class="deliver-visit-form-btn deliver-visit-flow-step is-done' +
                    (on ? " is-active" : "") +
                    '" data-edc-form-key="' +
                    fKey +
                    '" data-edc-visit-id="' +
                    v.id +
                    '">' +
                    '<span class="deliver-visit-flow-step__num">' +
                    step.num +
                    "</span>" +
                    '<div class="deliver-visit-flow-step__body">' +
                    '<div class="deliver-visit-flow-step__label">' +
                    formLabel +
                    tag +
                    "</div>" +
                    '<div class="deliver-visit-flow-step__desk">' +
                    step.label +
                    "</div></div></button>"
                  );
                })
                .join("");
              return (
                '<div class="deliver-visit-item' +
                (isExp ? " is-expanded" : "") +
                (isSel ? " is-active" : "") +
                '">' +
                '<button type="button" class="deliver-visit-item__toggle" data-visit-fold-toggle="' +
                v.id +
                '" aria-expanded="' +
                (isExp ? "true" : "false") +
                '">' +
                "<span>" +
                v.label +
                '<span class="deliver-visit-item__meta">' +
                v.plan +
                " · " +
                v.date +
                "</span></span>" +
                '<span class="deliver-visit-item__chev" aria-hidden="true">▾</span>' +
                "</button>" +
                '<div class="deliver-visit-item__flow">' +
                stepsHtml +
                "</div></div>"
              );
            })
            .join("");

        deliverVisitNavEl.querySelectorAll("[data-visit-fold-toggle]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var vid = btn.getAttribute("data-visit-fold-toggle");
            deliverVisitUiState.selectedVisitId = vid;
            deliverVisitToggleExpanded(vid);
            renderDeliverVisitArchive();
          });
        });

        deliverVisitNavEl.querySelectorAll("[data-edc-form-key]").forEach(function (btn) {
          btn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            deliverVisitUiState.selectedVisitId = btn.getAttribute("data-edc-visit-id");
            deliverVisitUiState.selectedFormKey = btn.getAttribute("data-edc-form-key");
            deliverVisitUiState.expandedVisitIds[deliverVisitUiState.selectedVisitId] = true;
            renderDeliverVisitArchive();
          });
        });
      }

      function renderDeliverVisitArchive(options) {
        options = options || {};
        var ctx = getDeliverVisitArchiveContext();
        var root = document.getElementById("vc-edc-root");
        if (!ctx) {
          if (root) {
            root.innerHTML =
              '<div class="edc-empty-hint">暂无该研究的访视档案示例，请选择 <strong>H26104001</strong>。</div>';
          }
          renderDeliverVisitMainNav(null);
          return;
        }

        if (visitArchiveFilterScreen) {
          var screenKeys = Object.keys(ctx.study.subjects);
          visitArchiveFilterScreen.innerHTML = screenKeys
            .map(function (sc) {
              var sel = sc === ctx.screenId ? " selected" : "";
              return '<option value="' + sc + '"' + sel + ">" + sc + "</option>";
            })
            .join("");
        }

        var visits = ctx.subject.visits;
        if (!deliverVisitUiState.selectedVisitId && visits.length) {
          deliverVisitUiState.selectedVisitId = visits[0].id;
        }
        deliverVisitEnsureExpandedDefaults(visits, !!options.expandAllVisits);

        var sel = deliverEdcResolveSelection(ctx, visits);
        if (options.resetForm) {
          var flow0 = deliverVisitFlowForType(sel.visit.type, { trimProduct: sel.visit.trimProduct });
          if (flow0.length) {
            deliverVisitUiState.selectedFormKey = deliverEdcFormKey(
              sel.visit.id,
              deliverEdcFormIdForStep(flow0[0].label)
            );
          }
        }

        renderDeliverVisitMainNav(ctx);
        sel = deliverEdcResolveSelection(ctx, visits);
        renderDeliverEdcForm(ctx, sel.visit, sel.formId, sel.step);

        if (options.expandAllVisits && !deliverVisitUiState.selectedFormKey && visits.length) {
          var f = deliverVisitFlowForType(visits[0].type, { trimProduct: visits[0].trimProduct });
          if (f.length) {
            deliverVisitUiState.selectedFormKey = deliverEdcFormKey(
              visits[0].id,
              deliverEdcFormIdForStep(f[0].label)
            );
            renderDeliverVisitMainNav(ctx);
            sel = deliverEdcResolveSelection(ctx, visits);
            renderDeliverEdcForm(ctx, sel.visit, sel.formId, sel.step);
          }
        }
      }

      function resetVisitArchiveUiState() {
        deliverVisitUiState.selectedVisitId = null;
        deliverVisitUiState.selectedFormKey = null;
        deliverVisitUiState.expandedVisitIds = {};
      }

      function initVisitArchiveFilters() {
        function onFilterChange() {
          resetVisitArchiveUiState();
          renderDeliverVisitArchive({ expandAllVisits: true, resetForm: true });
        }
        if (visitArchiveFilterStudy) {
          visitArchiveFilterStudy.addEventListener("change", onFilterChange);
        }
        if (visitArchiveFilterScreen) {
          visitArchiveFilterScreen.addEventListener("change", onFilterChange);
        }
      }
      initVisitArchiveFilters();

      function showDeliverPage() {
        if (pageDeliver) {
          pageDeliver.hidden = false;
          pageDeliver.classList.add("is-visible");
        }
        if (pagePlaceholder) pagePlaceholder.classList.remove("is-visible");
      }

      function hideDeliverPage() {
        if (pageDeliver) {
          pageDeliver.classList.remove("is-visible");
          pageDeliver.hidden = true;
        }
      }

      function showSchedulePage() {
        if (pageSchedule) {
          pageSchedule.hidden = false;
          pageSchedule.classList.add("is-visible");
        }
        if (pagePlaceholder) pagePlaceholder.classList.remove("is-visible");
        syncAllAcceptanceRows();
      }

      function hideSchedulePage() {
        if (pageSchedule) {
          pageSchedule.classList.remove("is-visible");
          pageSchedule.hidden = true;
        }
      }

      var pageVisit = document.getElementById("page-visit");
      var currentVisitView = "front-desk";

      function setVisitSidebarActive(viewId) {
        document.querySelectorAll("#sidebar-nav-visit [data-visit-view]").forEach(function (btn) {
          var on = btn.getAttribute("data-visit-view") === viewId;
          btn.classList.toggle("is-active", on);
          if (on) btn.setAttribute("aria-current", "page");
          else btn.removeAttribute("aria-current");
        });
      }

      function switchVisitView(viewId, options) {
        options = options || {};
        if (!viewId) viewId = "front-desk";
        currentVisitView = viewId;
        document.querySelectorAll("[data-visit-panel]").forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-visit-panel") === viewId);
        });
        setVisitSidebarActive(viewId);
        if (!options.skipPersist) persistNavState();
      }

      function showVisitPage() {
        if (pageVisit) {
          pageVisit.hidden = false;
          pageVisit.classList.add("is-visible");
        }
        if (pagePlaceholder) pagePlaceholder.classList.remove("is-visible");
        switchVisitView(currentVisitView || "front-desk", { skipPersist: true });
      }

      function hideVisitPage() {
        if (pageVisit) {
          pageVisit.classList.remove("is-visible");
          pageVisit.hidden = true;
        }
      }

      var pageVisitCollect = document.getElementById("page-visit-collect");
      var pageCollect = document.getElementById("page-collect");
      var currentVisitCollectView = "front-desk";
      var currentCollectDesk = "instrument";

      var collectDeskMeta = {
        instrument: {
          title: "仪器测量台",
          subtitle: "采集提交 · EDC 落库 · Corneometer / TEWL 等原始值写入 CRF 字段"
        },
        imaging: {
          title: "影像评估台",
          subtitle: "采集提交 · VISIA / 标准光照片 · 关联影像 CRF 与源数据附件"
        },
        efficacy: {
          title: "功效评估台",
          subtitle: "采集提交 · 专家评分 / 自评问卷 · 与访视执行访视树节点对齐"
        }
      };

      function setVisitCollectSidebarActive(viewId) {
        document.querySelectorAll("#sidebar-nav-visit-collect [data-vc-view]").forEach(function (btn) {
          var on = btn.getAttribute("data-vc-view") === viewId;
          btn.classList.toggle("is-active", on);
          if (on) btn.setAttribute("aria-current", "page");
          else btn.removeAttribute("aria-current");
        });
      }

      function switchVisitCollectView(viewId, options) {
        options = options || {};
        if (!viewId) viewId = "front-desk";
        currentVisitCollectView = viewId;
        document.querySelectorAll("[data-vc-panel]").forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-vc-panel") === viewId);
        });
        setVisitCollectSidebarActive(viewId);
        if (viewId === "crf-work") {
          renderDeliverVisitArchive();
        }
        if (!options.skipPersist) persistNavState();
      }

      function showVisitCollectPage() {
        if (pageVisitCollect) {
          pageVisitCollect.hidden = false;
          pageVisitCollect.classList.add("is-visible");
        }
        if (pagePlaceholder) pagePlaceholder.classList.remove("is-visible");
        switchVisitCollectView(currentVisitCollectView || "front-desk", { skipPersist: true });
      }

      function hideVisitCollectPage() {
        if (pageVisitCollect) {
          pageVisitCollect.classList.remove("is-visible");
          pageVisitCollect.hidden = true;
        }
      }

      function switchCollectDesk(deskId, options) {
        options = options || {};
        if (!deskId) deskId = "instrument";
        currentCollectDesk = deskId;
        var meta = collectDeskMeta[deskId] || collectDeskMeta.instrument;
        var titleEl = document.getElementById("collect-page-title");
        var subEl = document.getElementById("collect-page-subtitle");
        if (titleEl) titleEl.textContent = meta.title;
        if (subEl) subEl.textContent = meta.subtitle;
        if (!options.skipPersist) persistNavState();
      }

      function showCollectPage() {
        if (pageCollect) {
          pageCollect.hidden = false;
          pageCollect.classList.add("is-visible");
        }
        if (pagePlaceholder) pagePlaceholder.classList.remove("is-visible");
        switchCollectDesk(currentCollectDesk || "instrument", { skipPersist: true });
      }

      function hideCollectPage() {
        if (pageCollect) {
          pageCollect.classList.remove("is-visible");
          pageCollect.hidden = true;
        }
      }

      function showPrepStudyChain() {
        if (pagePrep) {
          pagePrep.hidden = false;
          pagePrep.classList.add("is-visible");
        }
        if (pagePlaceholder) pagePlaceholder.classList.remove("is-visible");
        switchPrepView(currentPrepView || "study-chain", { skipPersist: true });
      }

      function hidePrepStudyChain() {
        if (pagePrep) {
          pagePrep.classList.remove("is-visible");
          pagePrep.hidden = true;
        }
      }
      var phaseButtons = document.querySelectorAll(".phase-nav button");
      var appSidebar = document.getElementById("app-sidebar");
      var sidebarNavSchedule = document.getElementById("sidebar-nav-schedule");
      var sidebarNavRecruit = document.getElementById("sidebar-nav-recruit");
      var sidebarNavPrep = document.getElementById("sidebar-nav-prep");
      var sidebarNavVisit = document.getElementById("sidebar-nav-visit");
      var sidebarNavVisitCollect = document.getElementById("sidebar-nav-visit-collect");
      var sidebarNavCollect = document.getElementById("sidebar-nav-collect");
      var sidebarNavDeliver = document.getElementById("sidebar-nav-deliver");
      var sidebarNavSettings = document.getElementById("sidebar-nav-settings");

      function switchPhaseSidebar(phase) {
        var isSchedule = phase === "schedule";
        var isRecruit = phase === "recruit";
        var isPrep = phase === "prep";
        var isVisitCollect = phase === "visit-collect";
        var isVisitLane = isVisitCollect;
        var isCollect = false;
        var isDeliver = phase === "deliver";
        var isSettings = phase === "settings";
        if (appSidebar) {
          appSidebar.classList.toggle("is-phase-schedule", isSchedule);
          appSidebar.classList.toggle("is-phase-recruit", isRecruit);
          appSidebar.classList.toggle("is-phase-prep", isPrep);
          appSidebar.classList.toggle("is-phase-visit", false);
          appSidebar.classList.toggle("is-phase-visit-collect", isVisitCollect);
          appSidebar.classList.toggle("is-phase-collect", isCollect);
          appSidebar.classList.toggle("is-phase-deliver", isDeliver);
          appSidebar.classList.toggle("is-phase-settings", isSettings);
        }
        if (sidebarNavSchedule) sidebarNavSchedule.classList.toggle("is-hidden", !isSchedule);
        if (sidebarNavRecruit) sidebarNavRecruit.classList.toggle("is-hidden", !isRecruit);
        if (sidebarNavPrep) sidebarNavPrep.classList.toggle("is-hidden", !isPrep);
        if (sidebarNavVisit) sidebarNavVisit.classList.toggle("is-hidden", true);
        if (sidebarNavVisitCollect) sidebarNavVisitCollect.classList.toggle("is-hidden", !isVisitLane);
        if (sidebarNavCollect) sidebarNavCollect.classList.toggle("is-hidden", !isCollect);
        if (sidebarNavDeliver) sidebarNavDeliver.classList.toggle("is-hidden", !isDeliver);
        if (sidebarNavSettings) sidebarNavSettings.classList.toggle("is-hidden", !isSettings);
      }

      var NAV_STORAGE_KEY = "kis-p01-prototype-nav";

      function persistNavState() {
        var activeBtn = document.querySelector(".phase-nav button.is-active");
        var phase = activeBtn ? activeBtn.getAttribute("data-phase") : "prep";
        phase = normalizePhase(phase);
        if (!phase || !phaseLabels[phase]) phase = "prep";
        var state = { phase: phase };
        if (phase === "recruit") {
          var detailOpen =
            pagePlanDetail && !pagePlanDetail.classList.contains("is-hidden");
          if (detailOpen) {
            state.recruitView = "plans";
            var subEl = document.getElementById("plan-detail-subtitle");
            state.planDetailOpen = true;
            state.planDetailSubtitle = subEl ? subEl.textContent : "";
          } else {
            state.recruitView = currentRecruitView || "plans";
          }
        }
        if (phase === "deliver") {
          state.deliverView = currentDeliverView || "project-list";
        }
        if (phase === "prep") {
          state.prepView = currentPrepView || "study-chain";
        }
        if (phase === "visit-collect") {
          state.visitCollectView = currentVisitCollectView || "front-desk";
          state.visitArchiveReadonly = visitArchiveReadonlyMode;
        }
        try {
          sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(state));
        } catch (err) { /* quota / private mode */ }
      }

      function activatePhase(phase, options) {
        options = options || {};
        phase = normalizePhase(phase);
        if (!phase || !phaseLabels[phase]) return;
        var targetBtn = null;
        phaseButtons.forEach(function (b) {
          if (b.getAttribute("data-phase") === phase) targetBtn = b;
        });
        if (!targetBtn) return;

        phaseButtons.forEach(function (b) {
          b.classList.toggle("is-active", b === targetBtn);
          if (b === targetBtn) b.setAttribute("aria-current", "page");
          else b.removeAttribute("aria-current");
        });
        switchPhaseSidebar(phase);

        if (phase === "recruit") {
          pageRecruit.classList.remove("is-hidden");
          hidePrepStudyChain();
          hideDeliverPage();
          hideSchedulePage();
          hideVisitPage();
          hideVisitCollectPage();
          hideCollectPage();
          pagePlaceholder.classList.remove("is-visible");
          switchRecruitView(currentRecruitView || "plans", { skipPersist: true });
        } else if (phase === "prep") {
          pageRecruit.classList.add("is-hidden");
          hideDeliverPage();
          hideSchedulePage();
          hideVisitPage();
          hideVisitCollectPage();
          hideCollectPage();
          showPrepStudyChain();
        } else if (phase === "deliver") {
          pageRecruit.classList.add("is-hidden");
          hidePrepStudyChain();
          hideSchedulePage();
          hideVisitPage();
          hideVisitCollectPage();
          hideCollectPage();
          showDeliverPage();
          switchDeliverView(currentDeliverView || "project-list", { skipPersist: true });
        } else if (phase === "schedule") {
          pageRecruit.classList.add("is-hidden");
          hidePrepStudyChain();
          hideDeliverPage();
          hideVisitPage();
          hideVisitCollectPage();
          hideCollectPage();
          showSchedulePage();
        } else if (phase === "visit-collect") {
          pageRecruit.classList.add("is-hidden");
          hidePrepStudyChain();
          hideDeliverPage();
          hideSchedulePage();
          hideVisitPage();
          hideCollectPage();
          pagePlaceholder.classList.remove("is-visible");
          if (!options.preserveReadonlyMode) {
            visitArchiveReadonlyMode = false;
            var vcTitleReset = document.getElementById("vc-page-title");
            var vcSubReset = document.getElementById("vc-page-subtitle");
            if (vcTitleReset) vcTitleReset.textContent = "访视 CRF 作业台";
            if (vcSubReset) {
              vcSubReset.textContent =
                "eCRF 作业 · 支持查看 / 编辑 / 质疑 · 左侧访视树 · 右侧 CRF 表单";
            }
            var modeBarReset = document.getElementById("vc-edc-mode-bar");
            if (modeBarReset) modeBarReset.hidden = false;
            visitArchiveEdcMode = "view";
          }
          showVisitCollectPage();
        } else {
          pageRecruit.classList.add("is-hidden");
          hidePrepStudyChain();
          hideDeliverPage();
          hideSchedulePage();
          hideVisitPage();
          hideVisitCollectPage();
          hideCollectPage();
          pagePlaceholder.classList.add("is-visible");
          if (phase === "settings") {
            pagePlaceholder.querySelector("p:first-child").textContent =
              "系统设置 · 侧栏 IA 已就绪";
            pagePlaceholder.querySelector("p:last-child").innerHTML =
              "请从左侧选择<strong>组织管理</strong>、<strong>人员管理</strong>、<strong>角色管理</strong>、<strong>权限管理</strong>、<strong>菜单管理</strong>、<strong>字典管理</strong>或<strong>日志管理</strong>；主内容区原型待后续开发。";
          } else {
            pagePlaceholder.querySelector("p:first-child").textContent =
              "该阶段页面尚未制作";
            pagePlaceholder.querySelector("p:last-child").innerHTML =
              "当前选中「<strong>" + phaseLabels[phase] + "</strong>」— 原型待后续开发。";
          }
        }
        if (!options.skipPersist) persistNavState();
      }

      function restoreNavState() {
        var raw;
        try {
          raw = sessionStorage.getItem(NAV_STORAGE_KEY);
        } catch (e) {
          return false;
        }
        if (!raw) return false;
        var state;
        try {
          state = JSON.parse(raw);
        } catch (e2) {
          return false;
        }
        if (!state || !state.phase) return false;
        state.phase = normalizePhase(state.phase);
        if (!phaseLabels[state.phase]) return false;

        if (state.recruitView) {
          currentRecruitView = state.recruitView;
          if (currentRecruitView === "screening-visit") currentRecruitView = "screening";
        }
        if (state.deliverView) currentDeliverView = state.deliverView;
        if (state.prepView) currentPrepView = state.prepView;
        if (state.visitView) currentVisitView = state.visitView;
        if (state.visitCollectView) currentVisitCollectView = state.visitCollectView;
        if (state.collectDesk) currentCollectDesk = state.collectDesk;
        if (typeof state.visitArchiveReadonly === "boolean") {
          visitArchiveReadonlyMode = state.visitArchiveReadonly;
        }

        activatePhase(state.phase, { skipPersist: true });

        if (state.phase === "visit-collect") {
          var vcTitle = document.getElementById("vc-page-title");
          var vcSub = document.getElementById("vc-page-subtitle");
          if (visitArchiveReadonlyMode) {
            if (vcTitle) vcTitle.textContent = "访视档案（只读副本）";
            if (vcSub) {
              vcSub.textContent =
                "交付归档视角 · 与「访视执行」同源数据 · 已锁定字段不可编辑（原型示意）";
            }
          }
          renderDeliverVisitArchive();
        }

        if (
          state.phase === "recruit" &&
          state.planDetailOpen &&
          (!state.recruitView || state.recruitView === "plans")
        ) {
          var sub = state.planDetailSubtitle || "";
          var sep = sub.indexOf(" · ");
          var studyId = sep >= 0 ? sub.slice(0, sep) : sub;
          var studyName = sep >= 0 ? sub.slice(sep + 3) : "";
          openPlanDetail(studyId, studyName, true);
        }

        persistNavState();
        return true;
      }

      phaseButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          activatePhase(btn.getAttribute("data-phase"));
        });
      });

      function stubNext(pageName) {
        toast("「" + pageName + "」将在后续原型中开发（请先确认 IA）");
      }

      function pushVersionLabel(versionNum) {
        return versionNum > 0 ? "已推送(V" + versionNum + ")" : "未推送";
      }

      function renderPushDispatchCell(tr) {
        var cell = tr.querySelector(".td-push-dispatch");
        if (!cell) return;
        var ver = parseInt(tr.getAttribute("data-push-version") || "0", 10);
        if (isNaN(ver) || ver < 0) ver = 0;
        cell.innerHTML = "";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "push-dispatch-btn " + (ver > 0 ? "is-pushed" : "is-unpushed");
        btn.setAttribute("data-action", "push-acceptance");
        btn.textContent = pushVersionLabel(ver);
        if (ver > 0) {
          btn.disabled = true;
          btn.title = "已推送至项目受理 · 升版推送待后续原型";
        } else {
          btn.title = "推送至计划排期 · 项目受理（首次为 V1）";
        }
        cell.appendChild(btn);
      }

      function syncAllPushDispatchCells() {
        document
          .querySelectorAll("#page-prep .study-chain-table tbody tr[data-study-id]")
          .forEach(renderPushDispatchCell);
      }

      syncAllPushDispatchCells();

      var studyChainTable = document.querySelector("#page-prep .study-chain-table");
      if (studyChainTable) {
        studyChainTable.addEventListener("click", function (e) {
          var pushBtn = e.target.closest('[data-action="push-acceptance"]');
          if (pushBtn && !pushBtn.disabled) {
            e.preventDefault();
            var tr = pushBtn.closest("tr[data-study-id]");
            if (tr) pushStudyToAcceptance(tr.getAttribute("data-study-id"), tr);
            return;
          }
          var detailLink = e.target.closest('[data-chain-action="detail"]');
          if (detailLink) {
            e.preventDefault();
            var trD = detailLink.closest("tr[data-study-id]");
            var id = trD ? trD.getAttribute("data-study-id") : "";
            toast("研究全链路 · 详情（" + id + "）— 原型示意");
          }
        });
      }

      function acceptanceRowByStudyId(studyId) {
        return document.querySelector('#acceptance-table-body tr[data-study-id="' + studyId + '"]');
      }

      var DESK_MAP_ATTR = { config: "data-ack-config", resource: "data-ack-resource" };

      function cycleDeskMapItemStatus(status) {
        if (status === "off") return "warn";
        if (status === "warn") return "ok";
        return "off";
      }

      function applyDeskMapItemStatus(btn, status) {
        btn.setAttribute("data-status", status);
        var dot = btn.querySelector(".lamp-dot");
        if (dot) {
          dot.className = "lamp-dot lamp-dot--" + status;
        }
      }

      function aggregateDeskMapLevel(tr) {
        var items = tr.querySelectorAll(".desk-map-item[data-required=\"1\"]");
        if (!items.length) return "off";
        var hasOff = false;
        var hasWarn = false;
        items.forEach(function (btn) {
          var st = btn.getAttribute("data-status") || "off";
          if (st === "off") hasOff = true;
          if (st === "warn") hasWarn = true;
        });
        if (hasOff) return "off";
        if (hasWarn) return "warn";
        return "ok";
      }

      function formatDeskSyncStamp() {
        var now = new Date();
        return (
          now.getFullYear() +
          "-" +
          String(now.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getDate()).padStart(2, "0") +
          " " +
          String(now.getHours()).padStart(2, "0") +
          ":" +
          String(now.getMinutes()).padStart(2, "0")
        );
      }

      function clearConfigDeskMapSync(tr, studyId) {
        tr.setAttribute("data-ack-synced", "0");
        tr.removeAttribute("data-ack-sync-at");
        var accTr = acceptanceRowByStudyId(studyId);
        if (!accTr) return;
        var lv = aggregateDeskMapLevel(tr);
        accTr.setAttribute("data-ack-config", lv === "warn" ? "warn" : "off");
        syncAcceptanceRowActions(accTr);
      }

      function tryAutoSyncConfigDeskMapRow(tr, options) {
        options = options || {};
        var studyId = tr.getAttribute("data-study-id");
        var level = aggregateDeskMapLevel(tr);
        if (level !== "ok") {
          clearConfigDeskMapSync(tr, studyId);
          return false;
        }
        var accTr = acceptanceRowByStudyId(studyId);
        if (!accTr) return false;
        var wasSynced = tr.getAttribute("data-ack-synced") === "1";
        if (!wasSynced) {
          tr.setAttribute("data-ack-synced", "1");
          tr.setAttribute("data-ack-sync-at", formatDeskSyncStamp());
        }
        accTr.setAttribute("data-ack-config", "ok");
        syncAcceptanceRowActions(accTr);
        if (!wasSynced && options.toast) {
          toast(studyId + " · 须发布项已全绿，配置发布状态已自动同步执行调度");
        }
        return true;
      }

      function renderDeskMapRow(tr, deskKind) {
        var level = aggregateDeskMapLevel(tr);
        var aggCell = tr.querySelector('[data-col="map-aggregate"]');
        if (aggCell) {
          var aggTitle =
            deskKind === "config"
              ? "汇总：须发布项均为绿则自动同步执行调度"
              : "汇总：须发布/准备项均为绿方可回传";
          aggCell.innerHTML =
            '<span class="desk-map-aggregate" title="' +
            aggTitle +
            '">' +
            '<span class="lamp-dot lamp-dot--' +
            level +
            '"></span><span class="td-muted" style="font-size:11px;">' +
            downstreamAckText(level) +
            "</span></span>";
        }
        var syncAtCell = tr.querySelector('[data-col="map-sync-at"]');
        var syncActionCell = tr.querySelector('[data-col="map-sync-action"]');
        var syncCell = tr.querySelector('[data-col="map-sync"]');
        if (deskKind === "config" && syncCell) {
          tryAutoSyncConfigDeskMapRow(tr, { toast: false });
          var syncAt = (tr.getAttribute("data-ack-sync-at") || "").trim();
          if (level === "ok" && syncAt) {
            syncCell.innerHTML =
              '<span class="desk-sync-meta cell-mono" title="须发布项全绿后自动写入">' +
              syncAt +
              "</span>";
          } else {
            syncCell.innerHTML = '<span class="td-muted" style="font-size:12px;">—</span>';
          }
        } else if (deskKind === "resource") {
          var synced = tr.getAttribute("data-ack-synced") === "1";
          var syncAtRes = (tr.getAttribute("data-ack-sync-at") || "").trim();
          var canSync = level === "ok";
          if (syncAtCell) {
            if (synced && syncAtRes) {
              syncAtCell.innerHTML =
                '<span class="cell-mono" title="回传执行调度成功时间">' + syncAtRes + "</span>";
            } else {
              syncAtCell.innerHTML = '<span class="td-muted" style="font-size:12px;">—</span>';
            }
          }
          if (syncActionCell) {
            syncActionCell.innerHTML =
              '<button type="button" class="btn-op-link" data-action="sync-desk-ack" data-desk="' +
              deskKind +
              '"' +
              (canSync ? "" : " disabled") +
              ' title="' +
              (canSync ? "汇总已绿灯，回传执行调度 · 项目受理" : "须发布/准备项均为绿灯") +
              '">回传调度</button>';
          }
        }
        return level;
      }

      function updateDeskMapBanner(deskKind) {
        var tableId = deskKind === "config" ? "config-map-table" : "resource-map-table";
        var table = document.getElementById(tableId);
        var lamp = document.getElementById(deskKind === "config" ? "config-map-desk-lamp" : "resource-map-desk-lamp");
        var label = document.getElementById(
          deskKind === "config" ? "config-map-desk-label" : "resource-map-desk-label"
        );
        if (!table || !lamp || !label) return;
        var rows = table.querySelectorAll("tbody tr[data-study-id]");
        var allOk = rows.length > 0;
        var anyProgress = false;
        rows.forEach(function (tr) {
          var lv = aggregateDeskMapLevel(tr);
          if (lv !== "ok") allOk = false;
          if (lv === "warn" || lv === "ok") anyProgress = true;
        });
        var deskLevel = allOk ? "ok" : anyProgress ? "warn" : "off";
        lamp.className = "lamp-dot lamp-dot--" + deskLevel;
        var deskOkLabel =
          deskKind === "config"
            ? deskLevel === "ok"
              ? "已全部自动同步"
              : deskLevel === "warn"
                ? "跟进中"
                : "待跟进"
            : deskLevel === "ok"
              ? "全部可回传"
              : deskLevel === "warn"
                ? "跟进中"
                : "待跟进";
        label.textContent = (deskKind === "config" ? "配置发布台" : "资源准备台") + " · " + deskOkLabel;
      }

      function syncDeskMapAckToSchedule(studyId, deskKind) {
        if (deskKind === "config") {
          var configTr = document.querySelector(
            '#config-map-table tbody tr[data-study-id="' + studyId + '"]'
          );
          if (!configTr) return false;
          return tryAutoSyncConfigDeskMapRow(configTr, { toast: true });
        }
        var tableId = deskKind === "config" ? "config-map-table" : "resource-map-table";
        var mapTr = document.querySelector("#" + tableId + ' tbody tr[data-study-id="' + studyId + '"]');
        if (!mapTr) return false;
        var level = aggregateDeskMapLevel(mapTr);
        if (level !== "ok") {
          toast("须发布/准备项均为绿灯后才可回传执行调度");
          return false;
        }
        var accTr = acceptanceRowByStudyId(studyId);
        if (!accTr) {
          toast("执行调度 · 项目受理中无该研究（请先推送受理）");
          return false;
        }
        var attr = DESK_MAP_ATTR[deskKind];
        if (!attr) return false;
        accTr.setAttribute(attr, "ok");
        var stamp = formatDeskSyncStamp();
        mapTr.setAttribute("data-ack-synced", "1");
        mapTr.setAttribute("data-ack-sync-at", stamp);
        renderDeskMapRow(mapTr, deskKind);
        updateDeskMapBanner(deskKind);
        syncAcceptanceRowActions(accTr);
        var deskLabel = deskKind === "config" ? "配置发布" : "资源准备";
        toast(studyId + " · " + deskLabel + "状态已回传执行调度（绿灯）");
        return true;
      }

      function syncAllDeskMapTables() {
        ["config", "resource"].forEach(function (kind) {
          var tableId = kind === "config" ? "config-map-table" : "resource-map-table";
          var table = document.getElementById(tableId);
          if (!table) return;
          table.querySelectorAll("tbody tr[data-study-id]").forEach(function (tr) {
            renderDeskMapRow(tr, kind);
          });
          updateDeskMapBanner(kind);
        });
      }

      function wireDeskMapTable(tableId, deskKind) {
        var table = document.getElementById(tableId);
        if (!table) return;
        table.addEventListener("click", function (e) {
          var syncBtn = e.target.closest('[data-action="sync-desk-ack"]');
          if (syncBtn && !syncBtn.disabled) {
            var trS = syncBtn.closest("tr[data-study-id]");
            if (trS) syncDeskMapAckToSchedule(trS.getAttribute("data-study-id"), deskKind);
            return;
          }
          var item = e.target.closest(".desk-map-item");
          if (!item || item.getAttribute("data-required") === "0") return;
          var tr = item.closest("tr[data-study-id]");
          if (!tr) return;
          var next = cycleDeskMapItemStatus(item.getAttribute("data-status") || "off");
          applyDeskMapItemStatus(item, next);
          var wasSynced = deskKind === "config" && tr.getAttribute("data-ack-synced") === "1";
          renderDeskMapRow(tr, deskKind);
          if (deskKind === "config") {
            tryAutoSyncConfigDeskMapRow(tr, {
              toast: !wasSynced && tr.getAttribute("data-ack-synced") === "1"
            });
            renderDeskMapRow(tr, deskKind);
          }
          updateDeskMapBanner(deskKind);
        });
      }

      var DOWNSTREAM_DESKS = [
        { key: "ethics", label: "伦理批件", attr: "data-ack-ethics" },
        { key: "resource", label: "资源准备", attr: "data-ack-resource" },
        { key: "recruit", label: "招募预约", computed: true },
        { key: "config", label: "配置发布", attr: "data-ack-config" }
      ];
      var DOWNSTREAM_PAIR_GROUPS = [
        ["ethics", "resource"],
        ["recruit", "config"]
      ];

      wireDeskMapTable("config-map-table", "config");
      wireDeskMapTable("resource-map-table", "resource");

      function recruitAckFromPlanRow(studyId) {
        var planTr = planRowByStudyId(studyId);
        if (!planTr) return { pkg: "off", schedule: "off" };
        var st = readPlanRowInboundState(planTr);
        return {
          pkg: st.pkg === "confirmed" ? "ok" : st.pkg === "pending" ? "warn" : "off",
          schedule: st.schedule === "confirmed" ? "ok" : st.schedule === "pending" ? "warn" : "off"
        };
      }

      function inboundAckCompleteForDispatch(studyId, dispatchKind) {
        var planTr = planRowByStudyId(studyId);
        if (!planTr) return false;
        var st = readPlanRowInboundState(planTr);
        if (dispatchKind === "unscheduled") return st.pkg === "confirmed";
        if (dispatchKind === "scheduled") return st.pkg === "confirmed" && st.schedule === "confirmed";
        return false;
      }

      function recruitExecutionLampFromPlan(studyId, dispatchKind) {
        var planTr = planRowByStudyId(studyId);
        if (!planTr) return { level: "off", title: "招募执行：无计划行" };
        if (!inboundAckCompleteForDispatch(studyId, dispatchKind)) {
          return { level: "off", title: "招募执行：未开始（灰灯 · 须完成入站确认）" };
        }
        var st = readPlanRowInboundState(planTr);
        if (st.lifecycle === "completed") {
          return { level: "ok", title: "招募执行：已完成（绿灯）" };
        }
        if (st.lifecycle === "in_progress") {
          return { level: "warn", title: "招募执行：进行中（黄灯）" };
        }
        return { level: "off", title: "招募执行：未开始（灰灯）" };
      }

      function deskMetaByKey(key) {
        for (var i = 0; i < DOWNSTREAM_DESKS.length; i++) {
          if (DOWNSTREAM_DESKS[i].key === key) return DOWNSTREAM_DESKS[i];
        }
        return null;
      }

      function downstreamAckText(level) {
        if (level === "ok") return "绿灯";
        if (level === "warn") return "黄灯";
        return "灰灯";
      }

      function downstreamLabelTwoLines(text) {
        var t = String(text || "");
        if (t.length <= 2) {
          return '<span class="downstream-lamp-col__label"><span>' + t + "</span></span>";
        }
        var mid = Math.ceil(t.length / 2);
        return (
          '<span class="downstream-lamp-col__label"><span>' +
          t.slice(0, mid) +
          "</span><span>" +
          t.slice(mid) +
          "</span></span>"
        );
      }

      function renderDownstreamLampCol(key, levels, ariaParts) {
        var desk = deskMetaByKey(key);
        var level = levels[key] || "off";
        var label = desk ? desk.label : key;
        ariaParts.push(label + downstreamAckText(level));
        return (
          '<div class="downstream-lamp-col">' +
          '<span class="lamp-dot lamp-dot--' +
          level +
          '" title="' +
          label +
          " · " +
          downstreamAckText(level) +
          '"></span>' +
          downstreamLabelTwoLines(label) +
          "</div>"
        );
      }

      function buildDownstreamAckMarkup(levels) {
        var ariaParts = [];
        var pairsHtml = DOWNSTREAM_PAIR_GROUPS.map(function (keys) {
          var cols = keys
            .map(function (key) {
              return renderDownstreamLampCol(key, levels, ariaParts);
            })
            .join("");
          return '<div class="downstream-pair">' + cols + "</div>";
        }).join('<span class="downstream-lamps__sep" aria-hidden="true">-</span>');
        return {
          html:
            '<div class="downstream-ack-grid" aria-label="' +
            ariaParts.join("，") +
            '">' +
            pairsHtml +
            "</div>",
          aria: ariaParts.join("，")
        };
      }

      function acceptStatusOf(tr) {
        return tr.getAttribute("data-accept-status") || "pending";
      }

      function isAcceptanceDone(tr) {
        var s = acceptStatusOf(tr);
        return s === "unscheduled" || s === "scheduled";
      }

      function dispatchKindFromAcceptStatus(status) {
        if (status === "unscheduled" || status === "scheduled") return status;
        return "";
      }

      function recruitDeskAckLevel(tr) {
        var status = acceptStatusOf(tr);
        var kind = dispatchKindFromAcceptStatus(status);
        if (!kind) return "off";
        var studyId = tr.getAttribute("data-study-id");
        if (inboundAckCompleteForDispatch(studyId, kind)) return "ok";
        var ack = recruitAckFromPlanRow(studyId);
        if (kind === "unscheduled") {
          if (ack.pkg === "warn") return "warn";
          return ack.pkg === "ok" ? "ok" : "off";
        }
        if (ack.pkg === "warn" || ack.schedule === "warn") return "warn";
        if (ack.pkg === "ok" && ack.schedule === "ok") return "ok";
        return "off";
      }

      function downstreamAckLevels(tr) {
        var levels = {};
        if (!DOWNSTREAM_DESKS || !DOWNSTREAM_DESKS.length) return levels;
        DOWNSTREAM_DESKS.forEach(function (desk) {
          if (desk.computed) {
            levels[desk.key] = recruitDeskAckLevel(tr);
          } else {
            levels[desk.key] = tr.getAttribute(desk.attr) || "off";
          }
        });
        return levels;
      }

      function allDownstreamGreen(tr) {
        if (!isAcceptanceDone(tr)) return false;
        var levels = downstreamAckLevels(tr);
        return DOWNSTREAM_DESKS.every(function (d) {
          return levels[d.key] === "ok";
        });
      }

      function renderAcceptVersionCell(tr) {
        var cell = tr.querySelector('[data-col="accept-version"]');
        if (!cell) return;
        var ver = parseInt(tr.getAttribute("data-accept-version") || "0", 10);
        if (isNaN(ver) || ver < 1) {
          cell.innerHTML = '<span class="td-muted">—</span>';
          return;
        }
        cell.innerHTML = '<span class="badge-cell badge-cell--mini-off">V' + ver + "</span>";
      }

      function renderAcceptStatusCell(tr) {
        var cell = tr.querySelector('[data-col="accept-status"]');
        if (!cell) return;
        var status = acceptStatusOf(tr);
        if (status === "pending") {
          cell.innerHTML = '<span class="badge-cell badge-cell--muted">未受理</span>';
        } else if (status === "unscheduled") {
          cell.innerHTML =
            '<span class="accept-status-cell">' +
            '<span class="accept-status-cell__main">已受理</span>' +
            '<span class="accept-status-cell__kind">无排期</span></span>';
        } else if (status === "scheduled") {
          cell.innerHTML =
            '<span class="accept-status-cell">' +
            '<span class="accept-status-cell__main">已受理</span>' +
            '<span class="accept-status-cell__kind">有排期</span></span>';
        } else if (status === "rejected") {
          cell.innerHTML = '<span class="badge-cell badge-cell--err">已拒收</span>';
        } else {
          cell.innerHTML = '<span class="badge-cell badge-cell--muted">未受理</span>';
        }
      }

      function currentAcceptOperatorName() {
        var el = document.querySelector(".app-bar__user-name");
        return el && el.textContent ? el.textContent.trim() : "—";
      }

      function renderAcceptByCell(tr) {
        var cell = tr.querySelector('[data-col="accept-by"]');
        if (!cell) return;
        var status = acceptStatusOf(tr);
        if (status === "pending") {
          cell.className = "td-center td-muted";
          cell.textContent = "—";
          return;
        }
        if (status === "rejected") {
          var byRejected = tr.getAttribute("data-accept-by") || "—";
          cell.className = "td-center";
          cell.textContent = byRejected;
          cell.title = byRejected;
          return;
        }
        if (!isAcceptanceDone(tr)) {
          cell.className = "td-center td-muted";
          cell.textContent = "—";
          return;
        }
        var by = tr.getAttribute("data-accept-by") || "—";
        cell.className = "td-center";
        cell.textContent = by;
        cell.title = by;
      }

      function renderAcceptAtCell(tr) {
        var cell = tr.querySelector('[data-col="accept-at"]');
        if (!cell) return;
        var status = acceptStatusOf(tr);
        if (status === "pending") {
          cell.className = "td-center td-muted";
          cell.innerHTML = "—";
          return;
        }
        if (status === "rejected") {
          var atRejected = (tr.getAttribute("data-accept-at") || "").trim();
          if (!atRejected) {
            cell.className = "td-center td-muted";
            cell.innerHTML = "—";
            return;
          }
          tr.setAttribute("data-accept-at", atRejected);
          var mr = atRejected.match(/^(\d{4})-(\d{2}-\d{2})\s+(\d{2}:\d{2})/);
          cell.className = "td-center td-date";
          if (mr) {
            cell.innerHTML = '<span class="y">' + mr[1] + '</span><span class="md">' + mr[2] + " " + mr[3] + "</span>";
          } else {
            cell.textContent = atRejected;
          }
          return;
        }
        if (!isAcceptanceDone(tr)) {
          cell.className = "td-center td-muted";
          cell.innerHTML = "—";
          return;
        }
        var at = (tr.getAttribute("data-accept-at") || cell.textContent || "").trim();
        if (!at || at === "—") {
          cell.className = "td-center td-muted";
          cell.innerHTML = "—";
          return;
        }
        tr.setAttribute("data-accept-at", at);
        var m = at.match(/^(\d{4})-(\d{2}-\d{2})\s+(\d{2}:\d{2})/);
        cell.className = "td-center td-date";
        if (m) {
          cell.innerHTML = '<span class="y">' + m[1] + '</span><span class="md">' + m[2] + " " + m[3] + "</span>";
        } else {
          cell.textContent = at;
        }
      }

      function renderDownstreamAckCell(tr) {
        var cell = tr.querySelector('[data-col="desk-ack"]');
        if (!cell) return;
        if (!isAcceptanceDone(tr)) {
          cell.innerHTML = '<span class="td-muted">—</span>';
          return;
        }
        var built = buildDownstreamAckMarkup(downstreamAckLevels(tr));
        cell.innerHTML = built.html;
      }

      function renderAcceptActionsCell(tr) {
        var cell = tr.querySelector('[data-col="accept-actions"]');
        if (!cell) return;
        cell.innerHTML =
          '<button type="button" class="btn btn--text" data-action="accept-detail">详情</button>';
      }

      function syncAcceptanceRowActions(tr) {
        renderAcceptVersionCell(tr);
        renderAcceptStatusCell(tr);
        renderAcceptAtCell(tr);
        renderAcceptByCell(tr);
        renderDownstreamAckCell(tr);
        renderAcceptActionsCell(tr);
      }

      var acceptQuickFilterKey = "all";

      function acceptanceRowMatchesQuick(tr, key) {
        if (!tr || key === "all") return true;
        var status = acceptStatusOf(tr);
        if (key === "pending") return status === "pending";
        if (key === "rejected") return status === "rejected";
        if (key === "gate-fail") return isAcceptanceDone(tr) && !allDownstreamGreen(tr);
        return true;
      }

      function updateAcceptanceQuickCounts() {
        var rows = document.querySelectorAll("#acceptance-table-body tr[data-study-id]");
        var counts = { all: 0, pending: 0, "gate-fail": 0, rejected: 0 };
        rows.forEach(function (tr) {
          counts.all += 1;
          if (acceptStatusOf(tr) === "pending") counts.pending += 1;
          if (acceptStatusOf(tr) === "rejected") counts.rejected += 1;
          if (isAcceptanceDone(tr) && !allDownstreamGreen(tr)) counts["gate-fail"] += 1;
        });
        document.querySelectorAll("[data-accept-quick]").forEach(function (btn) {
          var key = btn.getAttribute("data-accept-quick");
          var span = btn.querySelector(".qf-count");
          if (!span || !key) return;
          var n = counts[key];
          if (typeof n !== "number") n = 0;
          span.textContent = "(" + n + ")";
        });
      }

      function applyAcceptanceQuickFilter() {
        document.querySelectorAll("#acceptance-table-body tr[data-study-id]").forEach(function (tr) {
          tr.hidden = !acceptanceRowMatchesQuick(tr, acceptQuickFilterKey);
        });
      }

      function syncAllAcceptanceRows() {
        document.querySelectorAll("#acceptance-table-body tr[data-study-id]").forEach(function (tr) {
          syncAcceptanceRowActions(tr);
        });
        updateAcceptanceQuickCounts();
        applyAcceptanceQuickFilter();
      }

      function syncAcceptanceFromRecruit(studyId) {
        var tr = acceptanceRowByStudyId(studyId);
        if (tr) syncAcceptanceRowActions(tr);
      }

      function formatAcceptTimestamp(d) {
        d = d || new Date();
        return (
          d.getFullYear() +
          "-" +
          String(d.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(d.getDate()).padStart(2, "0") +
          " " +
          String(d.getHours()).padStart(2, "0") +
          ":" +
          String(d.getMinutes()).padStart(2, "0")
        );
      }

      function acceptWithKind(studyId, kind) {
        var tr = acceptanceRowByStudyId(studyId);
        if (!tr) return;
        if (isAcceptanceDone(tr)) {
          toast(studyId + " · 已受理，不可重复受理（升版请走研究全链路再推送）");
          return;
        }
        if (kind !== "unscheduled" && kind !== "scheduled") return;
        tr.setAttribute("data-accept-status", kind);
        var ts = formatAcceptTimestamp();
        tr.setAttribute("data-accept-at", ts);
        tr.setAttribute("data-accept-by", currentAcceptOperatorName());
        if (tr.getAttribute("data-ack-ethics") === "off") {
          tr.setAttribute("data-ack-ethics", "warn");
        }
        syncAcceptanceRowActions(tr);
        var ver = tr.getAttribute("data-accept-version") || "1";
        var label = kind === "scheduled" ? "已受理·有排期" : "已受理·无排期";
        toast(studyId + " · " + label + "（V" + ver + "）· 已触发下游台回执跟踪");
      }

      function dispatchWorkorder(studyId) {
        var tr = acceptanceRowByStudyId(studyId);
        if (!tr || !isAcceptanceDone(tr)) {
          toast("请先完成受理");
          return;
        }
        if (!allDownstreamGreen(tr)) {
          toast(studyId + " · 下游四台尚未全部绿灯，暂不可工单派发");
          return;
        }
        toast(studyId + " · 工单派发（原型示意）· 排程 / 工单管理待挂接");
      }

      function pushStudyToAcceptance(studyId, prepTr) {
        if (acceptanceRowByStudyId(studyId)) {
          toast(studyId + " 已在项目受理列表中");
          phaseButtons.forEach(function (b) {
            if (b.getAttribute("data-phase") === "schedule") b.click();
          });
          return;
        }
        var studyName = "";
        if (prepTr) {
          var nameCell = prepTr.querySelector(".td-wrap");
          studyName = nameCell ? nameCell.textContent.trim() : "";
        }
        var tbody = document.getElementById("acceptance-table-body");
        if (!tbody) return;
        var tr = document.createElement("tr");
        tr.setAttribute("data-study-id", studyId);
        tr.setAttribute("data-study-name", studyName);
        tr.setAttribute("data-accept-status", "pending");
        tr.setAttribute("data-ack-ethics", "off");
        tr.setAttribute("data-ack-resource", "off");
        tr.setAttribute("data-ack-config", "off");
        var pushVer = 1;
        if (prepTr) {
          pushVer = parseInt(prepTr.getAttribute("data-push-version") || "0", 10) + 1;
          if (isNaN(pushVer) || pushVer < 1) pushVer = 1;
          tr.setAttribute("data-accept-version", String(pushVer));
          prepTr.setAttribute("data-push-version", String(pushVer));
          renderPushDispatchCell(prepTr);
        } else {
          tr.setAttribute("data-accept-version", "1");
        }
        tr.innerHTML =
          '<td class="col-acc-id-cell"><span class="cell-mono">' +
          studyId +
          '</span></td><td class="td-wrap"><span class="td-clamp-2">' +
          (studyName || "—") +
          '</span></td><td class="td-center" data-col="accept-version"></td>' +
          '<td class="td-center" data-col="accept-status"></td>' +
          '<td class="td-center td-muted" data-col="accept-at">—</td>' +
          '<td class="td-center td-muted" data-col="accept-by">—</td>' +
          '<td data-col="desk-ack"><span class="td-muted">—</span></td>' +
          '<td data-col="accept-actions"></td>';
        tbody.appendChild(tr);
        syncAcceptanceRowActions(tr);
        toast(
          studyId +
            " 已推送至「项目受理」· " +
            pushVersionLabel(pushVer) +
            " · 受理版本已带入 · 默认未受理"
        );
        phaseButtons.forEach(function (b) {
          if (b.getAttribute("data-phase") === "schedule") b.click();
        });
        tr.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }

      var acceptanceDetailBackdrop = document.getElementById("acceptance-detail-backdrop");
      var acceptanceDetailContext = { studyId: "" };

      function buildAcceptanceTimeline(studyId, studyName) {
        var tr = acceptanceRowByStudyId(studyId);
        var lines = [];
        lines.push("研究全链路 · 推送研究编号 " + studyId + "（" + studyName + "）");
        if (!tr) return lines;
        var status = acceptStatusOf(tr);
        var ver = tr.getAttribute("data-accept-version") || "—";
        if (status === "pending") {
          lines.push("○ 项目受理：未受理（V" + ver + " · 来自研究全链路推送）");
          lines.push("○ 待调度台处理受理或拒收");
        } else if (status === "rejected") {
          lines.push(
            "✗ 项目受理：已拒收 · V" +
              ver +
              " · " +
              (tr.getAttribute("data-accept-at") || "—") +
              " · " +
              (tr.getAttribute("data-accept-by") || "—")
          );
          return lines;
        } else {
          var statusLabel = status === "scheduled" ? "已受理·有排期" : "已受理·无排期";
          lines.push(
            "✓ 项目受理：" +
              statusLabel +
              " · V" +
              ver +
              " · " +
              (tr.getAttribute("data-accept-at") || "—")
          );
        }
        var levels = downstreamAckLevels(tr);
        DOWNSTREAM_DESKS.forEach(function (desk) {
          var level = levels[desk.key] || "off";
          var icon = level === "ok" ? "🟢" : level === "warn" ? "🟡" : "⚪";
          lines.push(icon + " 下游 · " + desk.label + "：" + downstreamAckText(level));
        });
        lines.push(
          allDownstreamGreen(tr)
            ? "✓ 工单派发：四台均已绿灯，可派发"
            : "○ 工单派发：须伦理批件 / 资源准备 / 招募预约 / 配置发布均为绿灯"
        );
        return lines;
      }

      function openAcceptanceDetail(studyId, studyName) {
        acceptanceDetailContext.studyId = studyId;
        document.getElementById("acceptance-detail-title").textContent = "回执详情 · " + studyId;
        document.getElementById("acceptance-detail-subtitle").textContent = studyName || "";
        var ul = document.getElementById("acceptance-detail-timeline");
        ul.innerHTML = "";
        buildAcceptanceTimeline(studyId, studyName).forEach(function (line) {
          var li = document.createElement("li");
          li.textContent = line;
          li.style.marginBottom = "6px";
          ul.appendChild(li);
        });
        acceptanceDetailBackdrop.hidden = false;
        acceptanceDetailBackdrop.setAttribute("aria-hidden", "false");
        acceptanceDetailBackdrop.classList.add("is-open");
      }

      function closeAcceptanceDetail() {
        acceptanceDetailBackdrop.classList.remove("is-open");
        acceptanceDetailBackdrop.setAttribute("aria-hidden", "true");
        acceptanceDetailBackdrop.hidden = true;
      }

      var acceptanceDetailCloseBtn = document.getElementById("acceptance-detail-close");
      if (acceptanceDetailCloseBtn) {
        acceptanceDetailCloseBtn.addEventListener("click", closeAcceptanceDetail);
      }
      if (acceptanceDetailBackdrop) {
        acceptanceDetailBackdrop.addEventListener("click", function (e) {
          if (e.target === acceptanceDetailBackdrop) closeAcceptanceDetail();
        });
      }
      var acceptanceDetailGoRecruit = document.getElementById("acceptance-detail-go-recruit");
      if (acceptanceDetailGoRecruit) {
        acceptanceDetailGoRecruit.addEventListener("click", function () {
          closeAcceptanceDetail();
          phaseButtons.forEach(function (b) {
            if (b.getAttribute("data-phase") === "recruit") b.click();
          });
          if (acceptanceDetailContext.studyId) {
            openInboundReviewForStudy(acceptanceDetailContext.studyId);
          } else {
            showPlanListShell();
          }
          toast("已跳转招募计划 · 入站确认后「招募预约」下游文案会同步为绿灯");
        });
      }

      var acceptQuickFilters = document.getElementById("accept-quick-filters");
      if (acceptQuickFilters) {
        acceptQuickFilters.addEventListener("click", function (e) {
          var btn = e.target.closest("[data-accept-quick]");
          if (!btn) return;
          acceptQuickFilterKey = btn.getAttribute("data-accept-quick") || "all";
          acceptQuickFilters.querySelectorAll("[data-accept-quick]").forEach(function (b) {
            b.classList.toggle("is-active", b === btn);
          });
          applyAcceptanceQuickFilter();
        });
      }

      var acceptanceTable = document.getElementById("acceptance-table");
      if (acceptanceTable) {
        acceptanceTable.addEventListener("click", function (e) {
          var tr = e.target.closest("tr[data-study-id]");
          if (!tr) return;
          var studyId = tr.getAttribute("data-study-id");
          var studyName = tr.getAttribute("data-study-name");
          if (e.target.closest('[data-action="accept-detail"]')) {
            openAcceptanceDetail(studyId, studyName);
          }
        });
      }

      function planRowByStudyId(studyId) {
        return document.querySelector('.plan-table tbody tr[data-study-id="' + studyId + '"]');
      }

      function readPlanRowInboundState(tr) {
        if (!tr) return null;
        return {
          pkg: tr.getAttribute("data-inbound-pkg") || "pending",
          schedule: tr.getAttribute("data-inbound-schedule") || "pending",
          lifecycle: tr.getAttribute("data-recruit-lifecycle") || "not_started"
        };
      }

      function writePlanRowInboundState(tr, state) {
        if (!tr || !state) return;
        tr.setAttribute("data-inbound-pkg", state.pkg);
        tr.setAttribute("data-inbound-schedule", state.schedule);
        tr.setAttribute("data-recruit-lifecycle", state.lifecycle);
      }

      function inboundFullyConfirmed(state) {
        return state.pkg === "confirmed" && state.schedule === "confirmed";
      }

      function resolveOpenInboundStep(tr) {
        var state = readPlanRowInboundState(tr);
        if (!state) return "package";
        if (state.pkg !== "confirmed") return "package";
        if (state.schedule !== "confirmed") return "schedule";
        return null;
      }

      function recruitStatusLabel(state) {
        if (state.lifecycle === "in_progress") {
          return { text: "进行中", cls: "badge-cell--status-active" };
        }
        if (state.lifecycle === "completed") {
          return { text: "已完成", cls: "badge-cell--status-done" };
        }
        return { text: "未开始", cls: "badge-cell--status-not-started" };
      }

      function readEnrollmentProgress(tr) {
        if (!tr) return { pct: 0, num: 0, denom: 0 };
        var cell = tr.querySelector('[data-col="enroll-rate"]');
        if (!cell) return { pct: 0, num: 0, denom: 0 };
        var fracEl = cell.querySelector(".rate-cell__frac");
        var pctEl = cell.querySelector(".rate-cell__pct");
        var num = 0;
        var denom = 0;
        if (fracEl) {
          var m = fracEl.textContent.match(/\((\d+)\s*\/\s*(\d+)\)/);
          if (m) {
            num = parseInt(m[1], 10);
            denom = parseInt(m[2], 10);
          }
        }
        var pct = 0;
        if (pctEl) {
          pct = parseFloat(String(pctEl.textContent).replace("%", "")) || 0;
        } else if (denom > 0) {
          pct = (num / denom) * 100;
        }
        return { pct: pct, num: num, denom: denom };
      }

      function syncRecruitLifecycleForRow(tr) {
        if (!tr) return;
        var state = readPlanRowInboundState(tr);
        var prog = readEnrollmentProgress(tr);
        var planActive =
          tr.getAttribute("data-recruit-plan-enabled") === "1" &&
          tr.getAttribute("data-recruit-plan-saved") === "1";
        var next = "not_started";
        if (prog.denom > 0 && prog.num >= prog.denom) {
          next = "completed";
        } else if (planActive) {
          next = "in_progress";
        }
        if (state.lifecycle !== next) {
          state.lifecycle = next;
          writePlanRowInboundState(tr, state);
        }
      }

      function syncPlanRowUi(studyId) {
        var tr = planRowByStudyId(studyId);
        if (!tr) return;
        syncRecruitLifecycleForRow(tr);
        var state = readPlanRowInboundState(tr);
        var badge = tr.querySelector(".plan-status-badge");
        if (badge) {
          var meta = recruitStatusLabel(state);
          badge.textContent = meta.text;
          badge.className = "badge-cell plan-status-badge " + meta.cls;
        }
        if (state.pkg === "confirmed" && state.schedule === "pending") {
          tr.setAttribute("data-inbound", "unscheduled");
        } else if (inboundFullyConfirmed(state)) {
          tr.setAttribute("data-inbound", "scheduled");
        }
        syncAcceptanceFromRecruit(studyId);
      }

      function resolvePlanDetailMode(tr) {
        if (!tr) return { mode: "inbound-package", step: "package" };
        var state = readPlanRowInboundState(tr);
        var planEnabled = tr.getAttribute("data-recruit-plan-enabled") === "1";
        var planSaved = tr.getAttribute("data-recruit-plan-saved") === "1";
        if (state.pkg !== "confirmed") {
          return { mode: "inbound-package", step: "package" };
        }
        if (planEnabled || planSaved) {
          return { mode: "plan-config", step: "package" };
        }
        if (state.schedule !== "confirmed") {
          return { mode: "plan-config", step: "package" };
        }
        return { mode: "plan-config", step: "package" };
      }

      function shouldShowInboundConfirm(tr, mode, step) {
        if (!tr || mode !== "inbound-package" && mode !== "inbound-schedule") return false;
        if (tr.getAttribute("data-recruit-plan-enabled") === "1") return false;
        if (mode === "inbound-package") {
          return readPlanRowInboundState(tr).pkg !== "confirmed";
        }
        if (mode === "inbound-schedule") {
          var st = readPlanRowInboundState(tr);
          return st.pkg === "confirmed" && st.schedule !== "confirmed";
        }
        return step === "package" || step === "schedule";
      }

      function applyInboundConfirm(studyId, step) {
        var tr = planRowByStudyId(studyId);
        if (!tr) return;
        var state = readPlanRowInboundState(tr);
        if (step === "package") {
          if (state.pkg === "confirmed") {
            toast("第①次招募包已确认，无需重复操作");
            return;
          }
          state.pkg = "confirmed";
          writePlanRowInboundState(tr, state);
          syncPlanRowUi(studyId);
          syncAcceptanceFromRecruit(studyId);
          if (inboundFullyConfirmed(state)) dismissInboundNotifyForStudy(studyId);
          toast("无排期招募包已确认 · 请再次打开「详情」配置招募计划");
          return;
        }
        if (step === "schedule") {
          if (state.pkg !== "confirmed") {
            toast("请先确认第①次招募包入站");
            return;
          }
          if (state.schedule === "confirmed") {
            toast("第②次访视排期已确认");
            return;
          }
          state.schedule = "confirmed";
          writePlanRowInboundState(tr, state);
          syncPlanRowUi(studyId);
          syncAcceptanceFromRecruit(studyId);
          dismissInboundNotifyForStudy(studyId);
          toast("第②次访视排期已确认 · 招募状态随计划保存与入组进度自动更新");
        }
      }

      function dismissInboundNotifyForStudy(studyId) {
        document.querySelectorAll('[data-notify-study="' + studyId + '"]').forEach(function (btn) {
          btn.hidden = true;
          var li = btn.closest("li");
          if (li) li.hidden = true;
        });
        updateNotifyBadge();
      }

      document.querySelectorAll(".plan-table tbody tr[data-study-id]").forEach(function (tr) {
        syncPlanRowUi(tr.getAttribute("data-study-id"));
      });

      var inboundStudyPart1 = {
        H2607051: {
          business_type: "功效",
          target_count: "36",
          backup_sample_count: "6",
          wei_sample_age: "18-45岁",
          wei_sample_gender: "女性",
          start_date: "2026-09-22",
          end_date: "2026-11-12",
          wei_visit_point: "T0 基线\nT7D 随访",
          wei_visit_count: "2",
          wei_visit_followup_duration: "约 2h/次",
          inclusion_criteria: "18–45 岁健康女性；近 4 周未使用同类功效产品；无严重皮肤疾病史；签署知情同意。",
          quota_info: "目标入组 36；备份 6；按 T0/T7 访视配额各不超过 20 人/日。",
          special_notes: "敏感肌占比不超过 30%；需预留 2 个筛败替换名额。",
          cautions: "访视当日勿化妆；T7 需与 T0 同一评估师；异常反应即时上报医学台。",
          scheduleRows: []
        },
        H26076887: {
          business_type: "彩妆",
          target_count: "80",
          backup_sample_count: "12",
          wei_sample_age: "20-50岁",
          wei_sample_gender: "不限",
          start_date: "2026-11-02",
          end_date: "2026-11-09",
          wei_visit_point: "T0 筛选访视\nT14D 功效访视",
          wei_visit_count: "2",
          wei_visit_followup_duration: "约 3h/次",
          inclusion_criteria: "20–50 岁；唇部无活动性损伤；同意现场拍照；非孕期/哺乳期。",
          quota_info: "计划预约 120（80×1.5）；T0 上午 20 人、T14 下午 15 人/批。",
          special_notes: "色号 PRG 7000021803 统一发放；需记录唇部基础色编号。",
          cautions: "访视前 24h 禁用润唇膏；有排期变更须重新确认有排期招募包。",
          scheduleRows: [
            { point: "T0 筛选访视", date: "2026-11-05", slot: "上午 · 20 人" },
            { point: "T14D 功效访视", date: "2026-11-19", slot: "下午 · 15 人" }
          ]
        },
        C26005288: {
          business_type: "功效",
          target_count: "10",
          backup_sample_count: "2",
          wei_sample_age: "22-40岁",
          wei_sample_gender: "不限",
          start_date: "2026-08-18",
          end_date: "2026-09-20",
          wei_visit_point: "V1 筛选到访\nV7D 功效随访",
          wei_visit_count: "2",
          wei_visit_followup_duration: "约 2.5h/次",
          inclusion_criteria: "22–40 岁；近 4 周未使用同类修护产品；无严重皮肤疾病；签署知情同意。",
          quota_info: "目标入组 10；计划预约 15（含筛败替换）；V1 每日不超过 8 人。",
          special_notes: "本项目为招募完成示例：预约 15/15、入组 10/10 均已满。",
          cautions: "访视当日勿化妆；异常反应即时上报医学台。",
          scheduleRows: [
            { point: "V1 筛选到访", date: "2026-09-18", slot: "上午 · 8 人" },
            { point: "V1 筛选到访", date: "2026-09-19", slot: "下午 · 7 人" }
          ]
        }
      };

      var inboundModalBackdrop = document.getElementById("inbound-modal-backdrop");
      var inboundModalFields = document.getElementById("inbound-modal-fields");
      var inboundModalExtraFields = document.getElementById("inbound-modal-extra-fields");
      var inboundModalScheduleBlock = document.getElementById("inbound-modal-schedule-block");
      var inboundModalScheduleBody = document.getElementById("inbound-modal-schedule-body");
      var inboundModalNoScheduleNote = document.getElementById("inbound-modal-no-schedule-note");
      var inboundModalTitle = document.getElementById("inbound-modal-title");
      var inboundModalSubtitle = document.getElementById("inbound-modal-subtitle");
      var inboundPlanSpecialistsPick = document.getElementById("inbound-plan-specialists-pick");
      var inboundPlanApptQuota = document.getElementById("inbound-plan-appt-quota");
      var inboundPlanApptHint = document.getElementById("inbound-plan-appt-hint");
      var inboundPlanPane = document.getElementById("inbound-modal-plan-pane");
      var inboundModalDialog = document.getElementById("inbound-modal-dialog");
      var inboundModalSplit = document.getElementById("inbound-modal-split");
      var inboundPlanEnable = document.getElementById("inbound-plan-enable");
      var inboundPlanFieldsWrap = document.getElementById("inbound-plan-fields-wrap");
      var inboundPlanSelect = document.getElementById("inbound-plan-select");
      var inboundModalQuery = document.getElementById("inbound-modal-query");
      var inboundModalConfirm = document.getElementById("inbound-modal-confirm");
      var inboundModalSave = document.getElementById("inbound-modal-save");
      var inboundModalRecruitStart = document.getElementById("inbound-modal-recruit-start");
      var inboundModalRecruitEnd = document.getElementById("inbound-modal-recruit-end");
      var inboundModalContext = { studyId: "", step: "package", mode: "inbound-package" };

      function defaultApptQuota(sampleSize) {
        var n = parseInt(String(sampleSize), 10);
        if (!n || n < 0) return 0;
        return Math.round(n * 1.5);
      }

      function readPlanRecruitPlan(tr) {
        if (!tr) return { apptQuota: "0", specialists: "" };
        var apptCell = tr.querySelector('[data-col="appt-quota"]');
        var specCell = tr.querySelector('[data-col="recruit-specialist"]');
        var sample = tr.getAttribute("data-sample-size") || "";
        var appt =
          tr.getAttribute("data-appt-quota") ||
          (apptCell ? apptCell.textContent.trim() : "");
        if (!appt || appt === "—") appt = String(defaultApptQuota(sample));
        var specialists =
          tr.getAttribute("data-specialists") ||
          (specCell && specCell.textContent.trim() !== "—" ? specCell.textContent.trim().replace(/、/g, ",") : "");
        return { apptQuota: appt, specialists: specialists };
      }

      function writePlanRecruitPlan(tr, plan) {
        if (!tr || !plan) return;
        var apptCell = tr.querySelector('[data-col="appt-quota"]');
        var specCell = tr.querySelector('[data-col="recruit-specialist"]');
        if (apptCell && plan.apptQuota !== undefined && plan.apptQuota !== "") {
          apptCell.textContent = plan.apptQuota;
          apptCell.classList.remove("td-muted");
        }
        var names = (plan.specialists || "").trim();
        if (specCell) {
          if (names) {
            specCell.textContent = names.split(/[,、]/).filter(Boolean).join("、");
            specCell.removeAttribute("title");
          } else {
            specCell.textContent = "—";
            specCell.title = "待分配";
          }
        }
        tr.setAttribute("data-specialists", names);
        if (plan.apptQuota !== undefined) tr.setAttribute("data-appt-quota", String(plan.apptQuota));
      }

      function syncInboundPlanEnableUi() {
        var on = inboundPlanEnable && inboundPlanEnable.checked;
        if (inboundPlanFieldsWrap) {
          inboundPlanFieldsWrap.classList.toggle("is-hidden", !on);
        }
      }

      function readInboundSpecialistSelection() {
        if (!inboundPlanSpecialistsPick) return [];
        return Array.prototype.map.call(
          inboundPlanSpecialistsPick.querySelectorAll(".specialist-pick.is-selected"),
          function (btn) {
            return btn.getAttribute("data-name");
          }
        ).filter(Boolean);
      }

      function setInboundSpecialistSelection(names) {
        if (!inboundPlanSpecialistsPick) return;
        var set = {};
        (names || []).forEach(function (n) {
          set[n] = true;
        });
        inboundPlanSpecialistsPick.querySelectorAll(".specialist-pick").forEach(function (btn) {
          var on = !!set[btn.getAttribute("data-name")];
          btn.classList.toggle("is-selected", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
      }

      function syncRecruitPlanFieldsToListRow(skipIfDisabled) {
        if (skipIfDisabled !== false && inboundPlanEnable && !inboundPlanEnable.checked) return;
        var tr = planRowByStudyId(inboundModalContext.studyId);
        if (!tr) return;
        var selected = readInboundSpecialistSelection();
        var appt = inboundPlanApptQuota ? inboundPlanApptQuota.value : "";
        if (!appt) {
          appt = String(defaultApptQuota(tr.getAttribute("data-sample-size") || "0"));
        }
        writePlanRecruitPlan(tr, { apptQuota: appt, specialists: selected.join(",") });
      }

      function populateInboundPlanForm(tr, part1) {
        if (!tr) return;
        var plan = readPlanRecruitPlan(tr);
        var sample = tr.getAttribute("data-sample-size") || (part1 && part1.target_count) || "0";
        var enabled = tr.getAttribute("data-recruit-plan-enabled") === "1";
        if (inboundPlanEnable) inboundPlanEnable.checked = enabled;
        syncInboundPlanEnableUi();
        if (inboundPlanApptQuota) inboundPlanApptQuota.value = plan.apptQuota;
        if (inboundPlanApptHint) {
          inboundPlanApptHint.textContent =
            "默认 = 样本量 " + sample + " × 1.5 → " + defaultApptQuota(sample) + " · 保存后同步列表";
        }
        setInboundSpecialistSelection(
          plan.specialists.split(/[,、]/).map(function (s) { return s.trim(); }).filter(Boolean)
        );
        if (inboundPlanSelect) {
          inboundPlanSelect.innerHTML = "";
          var optPrimary = document.createElement("option");
          optPrimary.value = "primary";
          optPrimary.textContent = "主招募计划 · 当前入站版本";
          optPrimary.selected = true;
          inboundPlanSelect.appendChild(optPrimary);
          var state = readPlanRowInboundState(tr);
          if (
            state.pkg === "confirmed" &&
            state.schedule !== "confirmed" &&
            tr.getAttribute("data-recruit-plan-enabled") !== "1"
          ) {
            var optSched = document.createElement("option");
            optSched.value = "schedule-inbound";
            optSched.textContent = "有排期招募包 · 入站审阅";
            inboundPlanSelect.appendChild(optSched);
          }
        }
      }

      function applyInboundModalLayout(mode, tr) {
        var showPlanPane = mode === "plan-config";
        if (inboundPlanPane) inboundPlanPane.classList.toggle("is-hidden", !showPlanPane);
        if (inboundModalDialog) {
          inboundModalDialog.classList.toggle("inbound-modal--single-col", !showPlanPane);
        }
        var showConfirm = shouldShowInboundConfirm(tr, mode, inboundModalContext.step);
        if (inboundModalQuery) inboundModalQuery.classList.toggle("is-hidden", !showConfirm);
        if (inboundModalConfirm) inboundModalConfirm.classList.toggle("is-hidden", !showConfirm);
        if (inboundModalSave) inboundModalSave.classList.toggle("is-hidden", mode !== "plan-config");
        if (inboundModalRecruitStart) inboundModalRecruitStart.classList.add("is-hidden");
        if (inboundModalRecruitEnd) inboundModalRecruitEnd.classList.add("is-hidden");
      }

      function saveRecruitPlanFromModal(showToast) {
        var tr = planRowByStudyId(inboundModalContext.studyId);
        if (!tr) return;
        var enabled = inboundPlanEnable && inboundPlanEnable.checked;
        tr.setAttribute("data-recruit-plan-enabled", enabled ? "1" : "0");
        tr.setAttribute("data-recruit-plan-saved", "1");
        if (enabled) {
          syncRecruitPlanFieldsToListRow(false);
        } else {
          writePlanRecruitPlan(tr, {
            apptQuota: tr.getAttribute("data-sample-size")
              ? defaultApptQuota(tr.getAttribute("data-sample-size"))
              : "0",
            specialists: ""
          });
          setInboundSpecialistSelection([]);
        }
        syncPlanRowUi(inboundModalContext.studyId);
        if (showToast !== false) {
          var trAfter = planRowByStudyId(inboundModalContext.studyId);
          var lc = trAfter ? trAfter.getAttribute("data-recruit-lifecycle") : "";
          if (enabled && lc === "in_progress") {
            toast("招募计划已保存 · 招募状态已更新为「进行中」· " + inboundModalContext.studyId);
          } else if (enabled && lc === "completed") {
            toast("招募计划已保存 · 入组已达 100%，招募状态为「已完成」");
          } else if (enabled) {
            toast("招募计划已保存 · " + inboundModalContext.studyId);
          } else {
            toast("已保存（未启动招募计划）· 招募状态保持「未开始」");
          }
        }
      }

      function renderInboundModalField(label, value, fullWidth, multiline) {
        var wrap = document.createElement("div");
        wrap.className = "inbound-modal__field" + (fullWidth ? " inbound-modal__field--full" : "");
        var lab = document.createElement("label");
        lab.textContent = label;
        var val = document.createElement("div");
        val.className = "inbound-modal__value" + (multiline ? " inbound-modal__value--multiline" : "");
        val.textContent = value || "—";
        wrap.appendChild(lab);
        wrap.appendChild(val);
        return wrap;
      }

      function renderInboundModalLeft(studyId, studyName, part1, step) {
        var isSchedule = step === "schedule";

        inboundModalFields.innerHTML = "";
        inboundModalFields.appendChild(renderInboundModalField("研究编号", studyId, false));
        inboundModalFields.appendChild(renderInboundModalField("研究名称", studyName, false));
        inboundModalFields.appendChild(renderInboundModalField("业务类型", part1.business_type, false));
        inboundModalFields.appendChild(renderInboundModalField("样本量", part1.target_count, false));
        inboundModalFields.appendChild(renderInboundModalField("备份样本量", part1.backup_sample_count, false));
        inboundModalFields.appendChild(renderInboundModalField("样本年龄", part1.wei_sample_age, false));
        inboundModalFields.appendChild(renderInboundModalField("样本性别", part1.wei_sample_gender, false));
        inboundModalFields.appendChild(renderInboundModalField("启动日期", part1.start_date, false));
        inboundModalFields.appendChild(renderInboundModalField("结束日期", part1.end_date, false));
        inboundModalFields.appendChild(renderInboundModalField("访视时间点", part1.wei_visit_point, true, true));
        inboundModalFields.appendChild(renderInboundModalField("访视次数", part1.wei_visit_count, false));
        inboundModalFields.appendChild(renderInboundModalField("每次随访时长", part1.wei_visit_followup_duration, false));

        if (inboundModalExtraFields) {
          inboundModalExtraFields.innerHTML = "";
          inboundModalExtraFields.appendChild(
            renderInboundModalField("入排标准", part1.inclusion_criteria, true, true)
          );
          inboundModalExtraFields.appendChild(
            renderInboundModalField("配额信息", part1.quota_info, true, true)
          );
          inboundModalExtraFields.appendChild(
            renderInboundModalField("特殊情况", part1.special_notes, true, true)
          );
          inboundModalExtraFields.appendChild(
            renderInboundModalField("注意事项", part1.cautions, true, true)
          );
        }

        if (isSchedule && part1.scheduleRows.length) {
          inboundModalScheduleBlock.classList.remove("is-hidden");
          inboundModalNoScheduleNote.classList.add("is-hidden");
          inboundModalScheduleBody.innerHTML = "";
          part1.scheduleRows.forEach(function (row) {
            var trRow = document.createElement("tr");
            trRow.innerHTML =
              "<td>" + row.point + "</td><td>" + row.date + "</td><td>" + row.slot + "</td>";
            inboundModalScheduleBody.appendChild(trRow);
          });
        } else {
          inboundModalScheduleBlock.classList.add("is-hidden");
          inboundModalNoScheduleNote.classList.remove("is-hidden");
        }
      }

      function openPlanDetailModal(studyId, studyName, forcedStep) {
        var part1 = inboundStudyPart1[studyId];
        if (!part1) {
          toast("暂无该研究的入站摘要 Mock");
          return;
        }
        var tr = planRowByStudyId(studyId);
        if (!studyName && tr) studyName = tr.getAttribute("data-study-name") || "";
        var resolved = tr ? resolvePlanDetailMode(tr) : { mode: "inbound-package", step: "package" };
        var mode = resolved.mode;
        var step = forcedStep || resolved.step;
        if (mode === "inbound-package") step = "package";
        inboundModalContext = { studyId: studyId, step: step, mode: mode };
        var isSchedule = step === "schedule" && (mode === "inbound-schedule" || mode === "inbound-package");
        if (mode === "plan-config") isSchedule = false;
        if (inboundModalTitle) {
          if (mode === "plan-config") {
            inboundModalTitle.textContent = "研究详情 · 招募计划配置";
          } else {
            inboundModalTitle.textContent =
              (isSchedule ? "有排期招募包" : "无排期招募包") + " · 入站审阅";
          }
        }
        if (inboundModalSubtitle) {
          inboundModalSubtitle.textContent =
            studyId +
            " · " +
            studyName +
            " · " +
            (mode === "plan-config"
              ? "无排期入站已确认 · 配置招募计划"
              : isSchedule
                ? "变更序 VSCH-T0-B · 含访视排期"
                : "变更序 RPKG-2026-09-24-02 · 无排期下发");
        }

        renderInboundModalLeft(studyId, studyName, part1, isSchedule ? "schedule" : "package");
        populateInboundPlanForm(tr, part1);
        applyInboundModalLayout(mode, tr);

        inboundModalBackdrop.hidden = false;
        inboundModalBackdrop.setAttribute("aria-hidden", "false");
        inboundModalBackdrop.classList.add("is-open");
      }

      function openInboundModal(studyId, studyName, step) {
        openPlanDetailModal(studyId, studyName, step);
      }

      function closeInboundModal() {
        inboundModalBackdrop.classList.remove("is-open");
        inboundModalBackdrop.setAttribute("aria-hidden", "true");
        inboundModalBackdrop.hidden = true;
      }

      var inboundModalCancelBtn = document.getElementById("inbound-modal-cancel");
      if (inboundModalCancelBtn) {
        inboundModalCancelBtn.addEventListener("click", closeInboundModal);
      }
      if (inboundModalBackdrop) {
        inboundModalBackdrop.addEventListener("click", function (e) {
          if (e.target === inboundModalBackdrop) closeInboundModal();
        });
      }
      if (inboundPlanEnable) {
        inboundPlanEnable.addEventListener("change", syncInboundPlanEnableUi);
      }
      if (inboundPlanSpecialistsPick) {
        inboundPlanSpecialistsPick.addEventListener("click", function (e) {
          var btn = e.target.closest(".specialist-pick");
          if (!btn || !inboundPlanEnable || !inboundPlanEnable.checked) return;
          var on = !btn.classList.contains("is-selected");
          btn.classList.toggle("is-selected", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
          syncRecruitPlanFieldsToListRow(false);
        });
      }
      if (inboundPlanApptQuota) {
        inboundPlanApptQuota.addEventListener("change", function () {
          if (inboundPlanEnable && inboundPlanEnable.checked) {
            syncRecruitPlanFieldsToListRow(false);
          }
        });
        inboundPlanApptQuota.addEventListener("input", function () {
          if (inboundPlanEnable && inboundPlanEnable.checked) {
            syncRecruitPlanFieldsToListRow(false);
          }
        });
      }
      if (inboundPlanSelect) {
        inboundPlanSelect.addEventListener("change", function () {
          var sid = inboundModalContext.studyId;
          var tr = planRowByStudyId(sid);
          var part1 = inboundStudyPart1[sid];
          if (!part1 || !tr) return;
          if (inboundPlanSelect.value === "schedule-inbound") {
            inboundModalContext.mode = "inbound-schedule";
            inboundModalContext.step = "schedule";
            if (inboundModalTitle) inboundModalTitle.textContent = "有排期招募包 · 入站审阅";
            renderInboundModalLeft(sid, tr.getAttribute("data-study-name") || "", part1, "schedule");
            applyInboundModalLayout("inbound-schedule", tr);
          } else {
            openPlanDetailModal(sid, tr.getAttribute("data-study-name") || "", "package");
          }
        });
      }
      if (inboundModalSave) {
        inboundModalSave.addEventListener("click", function () {
          saveRecruitPlanFromModal(true);
          closeInboundModal();
        });
      }
      if (inboundModalConfirm) {
        inboundModalConfirm.addEventListener("click", function () {
          applyInboundConfirm(inboundModalContext.studyId, inboundModalContext.step);
          closeInboundModal();
        });
      }
      if (inboundModalQuery) {
        inboundModalQuery.addEventListener("click", function () {
          toast("入站质疑（" + inboundModalContext.studyId + "）— 原型示意");
          closeInboundModal();
        });
      }
      var planTable = document.querySelector("table.plan-table");
      if (planTable) {
        planTable.addEventListener("click", function (e) {
          var detailBtn = e.target.closest("[data-action=\"open-plan-detail\"]");
          if (detailBtn) {
            var ctx = rowContextFrom(detailBtn);
            if (ctx) openPlanDetailModal(ctx.studyId, ctx.studyName);
          }
        });
      }

      function goInboundFromNotify(studyId) {
        closeNotifyPanel();
        if (studyId) openInboundReviewForStudy(studyId);
        else showPlanListShell();
      }
      function openNotifyPanel() {
        var panel = document.getElementById("notify-panel");
        var btn = document.getElementById("btn-notify");
        if (!panel) return;
        panel.hidden = false;
        panel.classList.add("is-open");
        if (btn) btn.setAttribute("aria-expanded", "true");
      }
      function closeNotifyPanel() {
        var panel = document.getElementById("notify-panel");
        var btn = document.getElementById("btn-notify");
        if (!panel) return;
        panel.classList.remove("is-open");
        if (btn) btn.setAttribute("aria-expanded", "false");
        panel.hidden = true;
      }
      function toggleNotifyPanel() {
        var panel = document.getElementById("notify-panel");
        if (!panel) return;
        if (panel.classList.contains("is-open")) closeNotifyPanel();
        else openNotifyPanel();
      }
      var btnNotify = document.getElementById("btn-notify");
      if (btnNotify) {
        btnNotify.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleNotifyPanel();
        });
      }
      document.querySelectorAll("[data-notify-go=\"inbound\"]").forEach(function (el) {
        el.addEventListener("click", function () {
          goInboundFromNotify(el.getAttribute("data-notify-study"));
        });
      });
      document.addEventListener("click", function (e) {
        var wrap = document.querySelector(".app-bar__notify-wrap");
        if (!wrap || wrap.contains(e.target)) return;
        closeNotifyPanel();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        if (inboundModalBackdrop && inboundModalBackdrop.classList.contains("is-open")) {
          closeInboundModal();
          return;
        }
        if (acceptanceDetailBackdrop && acceptanceDetailBackdrop.classList.contains("is-open")) {
          closeAcceptanceDetail();
          return;
        }
        closeNotifyPanel();
      });
      var btnExport = document.getElementById("btn-export");
      if (btnExport) {
        btnExport.addEventListener("click", function () {
          toast("导出需走审批流（PRD 脱敏与审计）— 原型示意");
        });
      }

      function updateTableRangeSummary() {
        var summary = document.getElementById("table-range-summary");
        if (!summary) return;
        var visible = document.querySelectorAll(".plan-table tbody tr:not([hidden])").length;
        var total = document.querySelectorAll(".plan-table tbody tr").length;
        summary.textContent = visible === total ? "共 " + total + " 条" : "共 " + visible + " 条（已筛选 / 总计 " + total + "）";
      }

      var currentPlanQuickFilter = "all";

      function planRowMatchesQuick(tr, quick) {
        if (quick === "all") return true;
        if (quick === "today-new") return tr.getAttribute("data-today-new") === "1";
        if (quick === "scheduled") return tr.getAttribute("data-inbound") === "scheduled";
        if (quick === "unscheduled") return tr.getAttribute("data-inbound") === "unscheduled";
        return true;
      }

      function applyPlanListFilters() {
        var statusVal = "all";
        var recruitStatusFilterEl = document.getElementById("recruit-status-filter");
        if (recruitStatusFilterEl) statusVal = recruitStatusFilterEl.value;
        document.querySelectorAll(".plan-table tbody tr[data-study-id]").forEach(function (tr) {
          var lc = tr.getAttribute("data-recruit-lifecycle") || "not_started";
          var statusOk = statusVal === "all" || lc === statusVal;
          var quickOk = planRowMatchesQuick(tr, currentPlanQuickFilter);
          tr.hidden = !(statusOk && quickOk);
        });
        updateTableRangeSummary();
      }

      updateTableRangeSummary();
      var recruitStatusFilter = document.getElementById("recruit-status-filter");
      if (recruitStatusFilter) {
        recruitStatusFilter.addEventListener("change", function () {
          applyPlanListFilters();
        });
      }
      document.querySelectorAll("#recruit-plan-quick-filters [data-quick]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          currentPlanQuickFilter = btn.getAttribute("data-quick") || "all";
          document.querySelectorAll("#recruit-plan-quick-filters [data-quick]").forEach(function (b) {
            b.classList.toggle("is-active", b === btn);
          });
          applyPlanListFilters();
          var label = btn.textContent.replace(/\s+/g, " ").trim();
          toast("快捷筛选：" + label + "（原型示意）");
        });
      });

      function setSidebarL2Active(btn) {
        var group = btn.closest(".sidebar-l2");
        if (!group) return;
        group.querySelectorAll("button").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
          if (b === btn) b.setAttribute("aria-current", "page");
          else b.removeAttribute("aria-current");
        });
      }

      function wireSidebarCollapse(toggleId, subId) {
        var sidebarToggle = document.getElementById(toggleId);
        var sidebarSub = document.getElementById(subId);
        if (!sidebarToggle || !sidebarSub) return;
        sidebarToggle.addEventListener("click", function () {
          var expanded = sidebarToggle.getAttribute("aria-expanded") === "true";
          sidebarToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
          sidebarSub.classList.toggle("is-collapsed", expanded);
        });
      }

      function initSidebarNavigation() {
        [
          ["sidebar-toggle-dispatch", "sidebar-dispatch-sub"],
          ["sidebar-toggle-recruit", "sidebar-recruit-sub"],
          ["sidebar-toggle-user-ops", "sidebar-user-ops-sub"],
          ["sidebar-toggle-med", "sidebar-med-sub"],
          ["sidebar-toggle-config", "sidebar-config-sub"],
          ["sidebar-toggle-resource", "sidebar-resource-sub"],
          ["sidebar-toggle-visit-ops", "sidebar-visit-ops-sub"],
          ["sidebar-toggle-visit-screen", "sidebar-visit-screen-sub"],
          ["sidebar-toggle-vc-ops", "sidebar-vc-ops-sub"],
          ["sidebar-toggle-deliver-project", "sidebar-deliver-project-sub"],
          ["sidebar-toggle-deliver-subject", "sidebar-deliver-subject-sub"],
          ["sidebar-toggle-deliver-ops", "sidebar-deliver-ops-sub"],
          ["sidebar-toggle-settings", "sidebar-settings-sub"]
        ].forEach(function (pair) {
          wireSidebarCollapse(pair[0], pair[1]);
        });

        function activatePhaseByName(phaseName) {
          phaseName = normalizePhase(phaseName);
          if (!phaseName || !phaseLabels[phaseName]) return;
          activatePhase(phaseName);
        }

        document.querySelectorAll(".sidebar-l2 button").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (btn.classList.contains("is-disabled")) {
              if (btn.classList.contains("is-active")) return;
              stubNext(btn.textContent.replace(/\s*\([^)]*\)/g, "").trim());
              return;
            }
            if (btn.hasAttribute("data-vc-open")) {
              openVisitCollectArchive({
                presetStudy: "H26104001",
                expandAllVisits: true,
                readonly: true
              });
              setSidebarL2Active(btn);
              toast("已在「访视执行」打开只读副本（交付归档入口）");
              return;
            }
            var vcView = btn.getAttribute("data-vc-view");
            if (vcView) {
              visitArchiveReadonlyMode = false;
              activatePhaseByName("visit-collect");
              switchVisitCollectView(vcView);
              setSidebarL2Active(btn);
              return;
            }
            var deliverView = btn.getAttribute("data-deliver-view");
            if (deliverView) {
              switchDeliverView(deliverView);
              activatePhaseByName("deliver");
              setSidebarL2Active(btn);
              return;
            }
            var recruitView = btn.getAttribute("data-recruit-view");
            if (recruitView) {
              switchRecruitView(recruitView);
              activatePhaseByName("recruit");
              return;
            }
            var visitView = btn.getAttribute("data-visit-view");
            if (visitView && !btn.classList.contains("is-disabled")) {
              activatePhaseByName("visit-collect");
              if (visitView === "front-desk" || visitView === "guide-progress") {
                switchVisitCollectView(visitView);
              } else {
                switchVisitView(visitView);
              }
              setSidebarL2Active(btn);
              return;
            }
            var scheduleView = btn.getAttribute("data-schedule-view");
            if (scheduleView) {
              activatePhaseByName("schedule");
              setSidebarL2Active(btn);
              return;
            }
            var prepView = btn.getAttribute("data-prep-view");
            if (prepView) {
              switchPrepView(prepView);
              activatePhaseByName("prep");
              setSidebarL2Active(btn);
              return;
            }
            var sidebarDesk = btn.getAttribute("data-sidebar");
            if (sidebarDesk) activatePhaseByName(sidebarDesk);
            setSidebarL2Active(btn);
          });
        });
      }

      initSidebarNavigation();

      document.querySelectorAll("[data-deliver-go]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var view = btn.getAttribute("data-deliver-go");
          switchDeliverView(view);
          toast("已跳转「" + (deliverViewMeta[view] ? deliverViewMeta[view].title : view) + "」");
        });
      });

      document.querySelectorAll("[data-vc-go]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          openVisitCollectArchive({
            presetStudy: "H26104001",
            expandAllVisits: true,
            readonly: false
          });
          toast("已跳转「访视执行 · 访视 CRF 作业台」");
        });
      });

      var vcEdcModeBar = document.getElementById("vc-edc-mode-bar");
      if (vcEdcModeBar) {
        vcEdcModeBar.querySelectorAll("[data-edc-mode]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            setVisitArchiveEdcMode(btn.getAttribute("data-edc-mode"));
          });
        });
      }

      if (deliverDocTabs) {
        deliverDocTabs.querySelectorAll("[data-deliver-doc]").forEach(function (tab) {
          tab.addEventListener("click", function () {
            deliverDocTabs.querySelectorAll("[data-deliver-doc]").forEach(function (t) {
              var on = t === tab;
              t.classList.toggle("is-active", on);
              t.setAttribute("aria-selected", on ? "true" : "false");
            });
            updateDeliverDocPreview(tab.getAttribute("data-deliver-doc"));
          });
        });
      }

      var apptCalState = { year: 2026, month: 8, selectedDay: 24 };
      var apptCalCountsSep2026 = {
        1: 186, 2: 142, 3: 165, 4: 178, 5: 201, 6: 156, 7: 134,
        8: 189, 9: 210, 10: 198, 11: 175, 12: 168, 13: 192, 14: 205,
        15: 188, 16: 176, 17: 163, 18: 171, 19: 184, 20: 199, 21: 215,
        22: 248, 23: 272, 24: 325, 25: 298, 26: 241, 27: 220, 28: 198,
        29: 176, 30: 154
      };
      var apptCalStudiesSep2026 = {
        1: 3, 2: 2, 3: 3, 4: 3, 5: 4, 6: 3, 7: 2,
        8: 3, 9: 3, 10: 3, 11: 3, 12: 2, 13: 3, 14: 4, 15: 3, 16: 3, 17: 2,
        18: 3, 19: 3, 20: 3, 21: 4, 22: 4, 23: 4, 24: 4, 25: 4, 26: 3, 27: 3,
        28: 3, 29: 2, 30: 2
      };

      function apptCountsForMonth(year, month) {
        if (year === 2026 && month === 8) return apptCalCountsSep2026;
        var out = {};
        var last = new Date(year, month + 1, 0).getDate();
        for (var d = 1; d <= last; d++) {
          out[d] = (d * 17 + month * 31) % 90;
        }
        return out;
      }

      function apptStudyCountsForMonth(year, month, apptCounts) {
        if (year === 2026 && month === 8) return apptCalStudiesSep2026;
        var out = {};
        var last = new Date(year, month + 1, 0).getDate();
        for (var d = 1; d <= last; d++) {
          var appt = apptCounts[d] != null ? apptCounts[d] : 0;
          out[d] = appt === 0 ? 0 : Math.min(5, Math.max(1, Math.floor(appt / 85) + 1));
        }
        return out;
      }

      function renderApptCalendar() {
        var grid = document.getElementById("appt-calendar-days");
        var titleEl = document.getElementById("appt-cal-title");
        if (!grid || !titleEl) return;
        var y = apptCalState.year;
        var m = apptCalState.month;
        titleEl.textContent = y + "年" + String(m + 1).padStart(2, "0") + "月";
        grid.innerHTML = "";
        grid.setAttribute("aria-label", y + "年" + (m + 1) + "月到访日");
        var first = new Date(y, m, 1);
        var daysInMonth = new Date(y, m + 1, 0).getDate();
        var startPad = (first.getDay() + 6) % 7;
        var counts = apptCountsForMonth(y, m);
        var studyCounts = apptStudyCountsForMonth(y, m, counts);
        var today = new Date();
        for (var i = 0; i < startPad; i++) {
          var pad = document.createElement("div");
          pad.className = "appt-day-cell is-empty";
          pad.setAttribute("aria-hidden", "true");
          grid.appendChild(pad);
        }
        for (var day = 1; day <= daysInMonth; day++) {
          var count = counts[day] != null ? counts[day] : 0;
          var studyCount = studyCounts[day] != null ? studyCounts[day] : 0;
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "appt-day-cell";
          btn.setAttribute("role", "gridcell");
          if (count === 0 && studyCount === 0) btn.classList.add("is-zero");
          if (day === apptCalState.selectedDay) btn.classList.add("is-selected");
          if (y === today.getFullYear() && m === today.getMonth() && day === today.getDate()) {
            btn.classList.add("is-today");
          }
          btn.setAttribute(
            "aria-label",
            day + "日 · " + count + " 条预约 · " + studyCount + " 个研究"
          );
          btn.innerHTML =
            '<span class="appt-day-cell__num">' +
            day +
            '</span><span class="appt-day-cell__stats">' +
            '<span class="appt-day-cell__studies" title="涉及研究数">' +
            studyCount +
            "</span>" +
            '<span class="appt-day-cell__count" title="预约人数">' +
            count +
            "</span></span>";
          (function (d, c, sc) {
            btn.addEventListener("click", function () {
              apptCalState.selectedDay = d;
              renderApptCalendar();
              var summary = document.getElementById("appt-queue-summary");
              var iso =
                y +
                "-" +
                String(m + 1).padStart(2, "0") +
                "-" +
                String(d).padStart(2, "0");
              if (summary) {
                summary.dataset.apptDay = iso + " 队列";
                applyApptQueueFilters();
              }
              toast(
                "已筛选到访日 " + iso + "（" + c + " 条预约 · " + sc + " 个研究 · 示意）"
              );
            });
          })(day, count, studyCount);
          grid.appendChild(btn);
        }
      }

      renderApptCalendar();
      var apptCalPrev = document.getElementById("appt-cal-prev");
      var apptCalNext = document.getElementById("appt-cal-next");
      if (apptCalPrev) {
        apptCalPrev.addEventListener("click", function () {
          apptCalState.month -= 1;
          if (apptCalState.month < 0) {
            apptCalState.month = 11;
            apptCalState.year -= 1;
          }
          apptCalState.selectedDay = 1;
          renderApptCalendar();
        });
      }
      if (apptCalNext) {
        apptCalNext.addEventListener("click", function () {
          apptCalState.month += 1;
          if (apptCalState.month > 11) {
            apptCalState.month = 0;
            apptCalState.year += 1;
          }
          apptCalState.selectedDay = 1;
          renderApptCalendar();
        });
      }

      function applyApptQueueFilters() {
        var study = "";
        var quickActive = document.querySelector(".appt-v1-stats button.is-active");
        if (quickActive) {
          var qs = quickActive.getAttribute("data-appt-study");
          if (qs != null && qs !== "") study = qs;
        }
        if (!study) {
          var studySel = document.getElementById("appt-filter-study");
          if (studySel && studySel.value) study = studySel.value;
        }
        var rows = document.querySelectorAll("#appt-queue-tbody tr[data-appt-study]");
        var visible = 0;
        rows.forEach(function (tr) {
          var ok = !study || tr.getAttribute("data-appt-study") === study;
          tr.hidden = !ok;
          if (ok) visible += 1;
        });
        var summary = document.getElementById("appt-queue-summary");
        if (summary) {
          var dayPart = summary.dataset.apptDay || "2026-09-24 队列";
          summary.textContent = "共 " + visible + " 条 · " + dayPart;
        }
      }

      function applyScreeningStudyFilter() {
        var sel = document.getElementById("screening-filter-study");
        var study = sel ? sel.value : "";
        var rows = document.querySelectorAll("#screening-visit-tbody tr[data-screening-study]");
        var visible = 0;
        rows.forEach(function (tr) {
          var ok = !study || tr.getAttribute("data-screening-study") === study;
          tr.hidden = !ok;
          if (ok) visible += 1;
        });
        var summary = document.getElementById("screening-visit-summary");
        if (summary) summary.textContent = "共 " + visible + " 条 · 只读快照";
      }

      function applyVisitStudyFilter() {
        var sel = document.getElementById("visit-filter-study");
        var study = sel ? sel.value : "";
        var rows = document.querySelectorAll("#visit-mgmt-tbody tr[data-visit-study]");
        var visible = 0;
        rows.forEach(function (tr) {
          var ok = !study || tr.getAttribute("data-visit-study") === study;
          tr.hidden = !ok;
          if (ok) visible += 1;
        });
        var summary = document.getElementById("visit-mgmt-summary");
        if (summary) summary.textContent = "共 " + visible + " 条 · 只读快照";
      }

      var apptFilterStudy = document.getElementById("appt-filter-study");
      if (apptFilterStudy) {
        apptFilterStudy.addEventListener("change", function () {
          document.querySelectorAll(".appt-v1-stats button").forEach(function (b) {
            b.classList.remove("is-active");
          });
          var allBtn = document.querySelector('.appt-v1-stats button[data-appt-study=""]');
          if (allBtn) allBtn.classList.add("is-active");
          applyApptQueueFilters();
        });
      }
      var screeningFilterStudy = document.getElementById("screening-filter-study");
      if (screeningFilterStudy) {
        screeningFilterStudy.addEventListener("change", applyScreeningStudyFilter);
      }
      var visitFilterStudy = document.getElementById("visit-filter-study");
      if (visitFilterStudy) {
        visitFilterStudy.addEventListener("change", applyVisitStudyFilter);
      }

      document.querySelectorAll(".appt-v1-stats button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.querySelectorAll(".appt-v1-stats button").forEach(function (b) {
            b.classList.toggle("is-active", b === btn);
          });
          if (apptFilterStudy) apptFilterStudy.value = "";
          applyApptQueueFilters();
          var label = btn.textContent.replace(/\s+/g, " ").trim();
          toast("研究快捷筛选：" + label);
        });
      });

      var apptSummaryEl = document.getElementById("appt-queue-summary");
      if (apptSummaryEl) apptSummaryEl.dataset.apptDay = "2026-09-24 队列";
      applyApptQueueFilters();

      var btnApptCreate = document.getElementById("btn-appt-create");
      var btnApptImport = document.getElementById("btn-appt-import");
      if (btnApptCreate) {
        btnApptCreate.addEventListener("click", function () {
          toast("新建预约（原型示意）— 对齐招募台弹窗：搜档案 / 快速录入 · G4 占档");
        });
      }
      if (btnApptImport) {
        btnApptImport.addEventListener("click", function () {
          toast("导入预约表（原型示意）— 主档匹配三态 · 预检后确认导入");
        });
      }
      document.querySelectorAll("[data-action=\"appt-stub\"]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          toast("「" + btn.textContent.trim() + "」（预约管理 · 原型示意）");
        });
      });

      var btnGuideScan = document.getElementById("btn-guide-scan");
      var btnGuideExport = document.getElementById("btn-guide-export");
      if (btnGuideScan) {
        btnGuideScan.addEventListener("click", function () {
          toast("扫码签到（原型示意）— 写入签到时间并生成 SC 号");
        });
      }
      if (btnGuideExport) {
        btnGuideExport.addEventListener("click", function () {
          toast("导出导检队列（原型示意）— 须审批");
        });
      }
      document.querySelectorAll("[data-action=\"guide-stub\"]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          toast("「" + btn.textContent.trim() + "」（导检进度 · 原型示意）");
        });
      });

      var btnMasterCreate = document.getElementById("btn-master-create");
      var btnMasterImport = document.getElementById("btn-master-import");
      var btnMasterExport = document.getElementById("btn-master-export");
      if (btnMasterCreate) {
        btnMasterCreate.addEventListener("click", function () {
          toast("新建建档（原型示意）— 用户运营台主档 CRUD · 分配受试者编号");
        });
      }
      if (btnMasterImport) {
        btnMasterImport.addEventListener("click", function () {
          toast("批量导入（原型示意）— 去重校验 · 失败行可导出补正");
        });
      }
      if (btnMasterExport) {
        btnMasterExport.addEventListener("click", function () {
          toast("导出主档（原型示意）— 须审批 · L1 默认掩码");
        });
      }
      document.querySelectorAll("[data-action=\"master-stub\"]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var tr = btn.closest("tr[data-master-id]");
          var id = tr ? tr.getAttribute("data-master-id") : "";
          toast("「" + btn.textContent.trim() + "」" + (id ? " · " + id : "") + "（主档管理 · 原型示意）");
        });
      });
      document.querySelectorAll("[data-master-quick]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.querySelectorAll("[data-master-quick]").forEach(function (b) {
            b.classList.toggle("is-active", b === btn);
          });
          toast("主档快捷筛选：" + btn.textContent.replace(/\s+/g, " ").trim() + "（原型示意）");
        });
      });

      document.querySelectorAll("#sidebar-nav-collect .sidebar-l1.is-leaf").forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.querySelectorAll("#sidebar-nav-collect .sidebar-l1.is-leaf").forEach(function (b) {
            b.classList.toggle("is-active", b === btn);
            if (b === btn) b.setAttribute("aria-current", "page");
            else b.removeAttribute("aria-current");
          });
          var desk = btn.getAttribute("data-collect-desk") || "instrument";
          activatePhase("visit-collect");
          switchVisitCollectView("crf-work");
          switchCollectDesk(desk);
        });
      });

      var collectEdcTabs = document.getElementById("collect-edc-tabs");
      if (collectEdcTabs) {
        collectEdcTabs.querySelectorAll("[data-collect-tab]").forEach(function (tab) {
          tab.addEventListener("click", function () {
            collectEdcTabs.querySelectorAll("[data-collect-tab]").forEach(function (t) {
              var on = t === tab;
              t.classList.toggle("is-active", on);
              t.setAttribute("aria-selected", on ? "true" : "false");
            });
            var key = tab.getAttribute("data-collect-tab");
            var rec = document.getElementById("collect-edc-panel-records");
            var crf = document.getElementById("collect-edc-panel-crf");
            if (rec) rec.hidden = key !== "records";
            if (crf) crf.hidden = key !== "crf";
          });
        });
      }

      updateNotifyBadge();

      if (!restoreNavState()) {
        switchPhaseSidebar("prep");
        showPrepStudyChain();
      }

      syncAllDeskMapTables();
      if (document.getElementById("acceptance-table-body")) {
        syncAllAcceptanceRows();
      }
    })();
