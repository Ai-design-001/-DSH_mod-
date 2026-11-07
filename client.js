window.__ModuleLoader__.load({
  id: 'dsh-plugin-session-delete-and-appearance',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'sessionDeleteAndAppearance';

    // ---- Locale --------------------------------------------------------------
    const zh = {
      'action.delete': '删除',
      'action.delete.hint': '删除会话（含未发送的「新会话」）',
      'hover.delete': '删除会话',
      'section.title': '外观定制',
      'font.title': '字体大小',
      'font.text': '正文',
      'font.text.desc': '会话内容字号',
      'font.code': '代码',
      'font.code.desc': '代码块、行内代码与工具输出',
      'font.terminal': '终端',
      'font.terminal.desc': '侧栏终端字号',
      'font.increase': '增大 {name}',
      'font.decrease': '减小 {name}',
      'font.unit': 'px',
      'color.title': '分区颜色',
      'color.desc': '选择颜色以覆盖该区域的浅色与深色配色；点击「恢复默认」清除单个区域。',
      'color.reset': '恢复默认',
      'color.resetAll': '全部恢复默认',
      'color.sidebar': '侧边栏背景',
      'color.bgBase': '主背景',
      'color.bgLayer1': '层级背景（一级）',
      'color.bgLayer2': '层级背景（二级）',
      'color.brand': '品牌强调色',
      'color.borderL1': '边框（一级）',
      'color.borderL2': '边框（二级）',
    };
    const en = {
      'action.delete': 'Delete',
      'action.delete.hint': 'Delete session, including an unsent New Session',
      'hover.delete': 'Delete session',
      'section.title': 'Customize appearance',
      'font.title': 'Font size',
      'font.text': 'Text',
      'font.text.desc': 'Conversation content size',
      'font.code': 'Code',
      'font.code.desc': 'Code blocks, inline code, and tool output',
      'font.terminal': 'Terminal',
      'font.terminal.desc': 'Sidebar terminal',
      'font.increase': 'Increase {name}',
      'font.decrease': 'Decrease {name}',
      'font.unit': 'px',
      'color.title': 'Section colors',
      'color.desc': 'Pick a color to override the region in light and dark; clear a region to restore its default.',
      'color.reset': 'Reset',
      'color.resetAll': 'Reset all',
      'color.sidebar': 'Sidebar background',
      'color.bgBase': 'Base background',
      'color.bgLayer1': 'Layer background (level 1)',
      'color.bgLayer2': 'Layer background (level 2)',
      'color.brand': 'Brand accent',
      'color.borderL1': 'Border (level 1)',
      'color.borderL2': 'Border (level 2)',
    };

    // ---- Color tokens --------------------------------------------------------
    const COLOR_TOKENS = [
      { key: 'sidebar', token: '--dsw-specific-sidebar-fill', label: 'color.sidebar' },
      { key: 'bgBase', token: '--dsw-alias-bg-base', label: 'color.bgBase' },
      { key: 'bgLayer1', token: '--dsw-alias-bg-layer-1', label: 'color.bgLayer1' },
      { key: 'bgLayer2', token: '--dsw-alias-bg-layer-2', label: 'color.bgLayer2' },
      { key: 'brand', token: '--dsw-alias-brand-primary', label: 'color.brand' },
      { key: 'borderL1', token: '--dsw-alias-border-l1', label: 'color.borderL1' },
      { key: 'borderL2', token: '--dsw-alias-border-l2', label: 'color.borderL2' },
    ];

    // ---- Font roles ----------------------------------------------------------
    const FONT_ROLES = [
      { key: 'text', min: 10, max: 22, label: 'font.text', desc: 'font.text.desc' },
      { key: 'code', min: 10, max: 16, label: 'font.code', desc: 'font.code.desc' },
      { key: 'terminal', min: 10, max: 20, label: 'font.terminal', desc: 'font.terminal.desc' },
    ];

    const STORAGE_KEY = 'dsh.session-delete-and-appearance.colors.v1';

    function loadColors() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object') ? parsed : {};
      } catch (e) { return {}; }
    }
    function saveColors(colors) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(colors)); } catch (e) {}
    }

    // ---- Inline icons --------------------------------------------------------
    function TrashIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true, fill: 'none' },
        h('path', {
          d: 'M6.5 1.5h3M2.5 3.5h11M5.5 3.5l.5-1.5h4l.5 1.5M4 5l.5 9h7l.5-9',
          stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round',
        })
      );
    }
    function ChevronUpIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 10, height: 10, 'aria-hidden': true, fill: 'none' },
        h('path', { d: 'M4 10l4-4 4 4', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }
    function ChevronDownIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 10, height: 10, 'aria-hidden': true, fill: 'none' },
        h('path', { d: 'M4 6l4 4 4-4', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' })
      );
    }

    // ---- Components ----------------------------------------------------------
    function DeleteSessionRowButton({ sessionId, useSessionAccess, deleteSession, t }) {
      const allowed = typeof useSessionAccess === 'function'
        ? useSessionAccess(sessionId, 'workspace/archiveSession')
        : true;
      if (!allowed) return null;
      return h('button', {
        type: 'button',
        'aria-label': t('action.delete'),
        title: t('action.delete'),
        onClick: (e) => { e.stopPropagation(); deleteSession(sessionId); },
        className: 'sdda-iconButton',
      }, h(TrashIcon));
    }

    // Delete row inside a session row's hover card. Reaches every row,
    // including the blank provisional "New Session" row.
    function HoverDeleteButton({ sessionId, useSessionAccess, deleteSession, t }) {
      const allowed = typeof useSessionAccess === 'function'
        ? useSessionAccess(sessionId, 'workspace/archiveSession')
        : true;
      if (!allowed) return null;
      return h('button', {
        type: 'button',
        className: 'sdda-hoverDelete',
        title: t('action.delete.hint'),
        onClick: (e) => { e.stopPropagation(); deleteSession(sessionId); },
      },
        h('span', { className: 'sdda-hoverDeleteIcon' }, h(TrashIcon)),
        h('span', { className: 'sdda-hoverDeleteLabel' }, t('hover.delete'))
      );
    }

    function FontSizeRow({ role, fontSize, t, onChange }) {
      const { min, max, label, desc } = role;
      return h('div', { className: 'sdda-row' },
        h('div', { className: 'sdda-rowText' },
          h('div', { className: 'sdda-title' }, t(label)),
          h('div', { className: 'sdda-desc' }, t(desc))
        ),
        h('div', { className: 'sdda-control' },
          h('div', { className: 'sdda-stepper' },
            h('span', { className: 'sdda-value' }, String(fontSize)),
            h('span', { className: 'sdda-arrows' },
              h('button', {
                type: 'button', className: 'sdda-arrow',
                'aria-label': t('font.increase', { name: t(label) }),
                disabled: fontSize >= max,
                onClick: () => onChange(role.key, Math.min(max, fontSize + 1)),
              }, h(ChevronUpIcon)),
              h('button', {
                type: 'button', className: 'sdda-arrow',
                'aria-label': t('font.decrease', { name: t(label) }),
                disabled: fontSize <= min,
                onClick: () => onChange(role.key, Math.max(min, fontSize - 1)),
              }, h(ChevronDownIcon))
            )
          ),
          h('span', { className: 'sdda-unit' }, t('font.unit'))
        )
      );
    }

    function ColorRow({ def, value, t, onChange, onReset }) {
      return h('div', { className: 'sdda-row' },
        h('div', { className: 'sdda-rowText' },
          h('div', { className: 'sdda-title' }, t(def.label))
        ),
        h('div', { className: 'sdda-control' },
          h('label', {
            className: 'sdda-swatch',
            style: value ? { background: value } : null,
          },
            h('input', {
              type: 'color',
              value: value || '#ffffff',
              'aria-label': t(def.label),
              onChange: (e) => onChange(def.key, e.target.value),
            })
          ),
          h('button', {
            type: 'button', className: 'sdda-link', disabled: !value,
            onClick: () => onReset(def.key),
          }, t('color.reset'))
        )
      );
    }

    function AppearanceCustomizeSection({ state, setFontSize, setColor, resetColor, resetAllColors, t }) {
      return h('div', { className: 'sdda-page' },
        h('div', { className: 'sdda-group' },
          h('div', { className: 'sdda-groupTitle' }, t('font.title')),
          FONT_ROLES.map((role) => h(FontSizeRow, {
            key: role.key,
            role,
            fontSize: state.fontSizes[role.key] != null ? state.fontSizes[role.key] : role.min,
            t,
            onChange: setFontSize,
          }))
        ),
        h('div', { className: 'sdda-group' },
          h('div', { className: 'sdda-groupTitle' }, t('color.title')),
          h('div', { className: 'sdda-desc', style: { marginBottom: '6px' } }, t('color.desc')),
          COLOR_TOKENS.map((def) => h(ColorRow, {
            key: def.key,
            def,
            value: state.colors[def.key] || null,
            t,
            onChange: setColor,
            onReset: resetColor,
          })),
          h('div', { className: 'sdda-footer' },
            h('button', {
              type: 'button', className: 'sdda-link',
              onClick: resetAllColors,
              disabled: Object.keys(state.colors).length === 0,
            }, t('color.resetAll'))
          )
        )
      );
    }

    // ---- Plugin --------------------------------------------------------------
    return {
      inject: ['slots', 'theme', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'sdda: dictionaries');
        const t = ctx.locale.bind(NS);

        // Inject plugin stylesheet.
        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.plugin = 'dsh-plugin-session-delete-and-appearance';
          style.textContent = stylesheetText();
          document.head.appendChild(style);
          return () => style.remove();
        }, 'sdda: stylesheet');

        function applyPersistedColors() {
          const colors = loadColors();
          const tokens = {};
          for (const def of COLOR_TOKENS) {
            const value = colors[def.key];
            if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
              tokens[def.token] = { light: value, dark: value };
            }
          }
          // Always re-override (even with an empty map) so a reset clears the
          // previous layer: overrideTokens replaces its source's whole layer.
          ctx.theme.overrideTokens('session-delete-and-appearance', tokens);
        }
        ctx.effect(() => { applyPersistedColors(); }, 'sdda: apply persisted colors');

        // One delete implementation shared by every surface that offers it.
        // The platform exposes no hard delete: the only removal is archiving.
        // An archived row stays visible (gray) while the sidebar shows archived
        // sessions, so a successful delete also returns the list to its default
        // "hide archived" mode — otherwise the row would linger as a gray line.
        const deleteInjected = () => ({
          deleteSession: async (sessionId) => {
            const uiWorkspace = ctx.get('uiWorkspace');
            if (uiWorkspace === undefined) return;
            try {
              await uiWorkspace.archiveSession(sessionId);
            } catch (reason) {
              console.error('[sdda] delete rejected:', reason);
              return;
            }
            try {
              const view = uiWorkspace.view;
              if (view !== null && typeof view === 'object' && typeof view.setArchivedFilter === 'function') {
                view.setArchivedFilter('default');
              }
            } catch (reason) {
              console.error('[sdda] hiding archived rows failed:', reason);
            }
          },
        });

        // Delete hover button on titled session rows.
        ctx.slots.inject('sidebar.workspaces.session.row.action', () => ctx.slots.register({
          name: 'sidebar.workspaces.session.row.action',
          id: 'delete-custom',
          order: 50,
          locale: NS,
          inject: deleteInjected,
        }, DeleteSessionRowButton));

        // Delete row inside the hover card. This is the one session-row surface
        // that also renders for the blank provisional "New Session" row, which
        // draws no action strip at all — so the new session can be deleted too.
        ctx.slots.inject('sidebar.session.row.hover', () => ctx.slots.register({
          name: 'sidebar.session.row.hover',
          id: 'delete-custom-hover',
          order: 50,
          locale: NS,
          inject: deleteInjected,
        }, HoverDeleteButton));

        // Dedicated settings section.
        ctx.slots.inject('settings.section', () => {
          return ctx.slots.register({
            name: 'settings.section',
            id: 'appearance-customize',
            order: 5,
            label: () => t('section.title'),
            locale: NS,
            inject: () => {
              const theme = ctx.get('theme');
              // Plain read + subscribe props; the section component owns the React state.
              const readThemeState = () => {
                let fontSizes = { text: 14, code: 11, terminal: 13 };
                try {
                  const s = theme && theme.getTheme();
                  if (s && s.fontSizes) fontSizes = s.fontSizes;
                } catch (e) {}
                return { fontSizes, colors: loadColors() };
              };
              const subscribeTheme = (listener) => ctx.on('theme/change', listener);
              return {
                readThemeState,
                subscribeTheme,
                setFontSize: (role, px) => { ctx.theme.setFontSize(role, px); },
                setColor: (key, value) => {
                  const colors = loadColors();
                  colors[key] = value;
                  saveColors(colors);
                  applyPersistedColors();
                },
                resetColor: (key) => {
                  const colors = loadColors();
                  delete colors[key];
                  saveColors(colors);
                  applyPersistedColors();
                },
                resetAllColors: () => {
                  saveColors({});
                  applyPersistedColors();
                },
              };
            },
          }, SectionBridge);
        });
      },
    };

    function SectionBridge(props) {
      const { readThemeState, subscribeTheme, setFontSize, setColor, resetColor, resetAllColors, t } = props;
      const [state, setState] = React.useState(readThemeState);
      React.useEffect(() => {
        const dispose = subscribeTheme(() => setState(readThemeState()));
        return () => { if (typeof dispose === 'function') dispose(); };
      }, []);
      return h(AppearanceCustomizeSection, {
        state, setFontSize, setColor, resetColor, resetAllColors, t,
      });
    }

    // ---- Stylesheet ----------------------------------------------------------
    function stylesheetText() { return `
.sdda-page { display: flex; flex-direction: column; }
.sdda-group { border-bottom: .5px solid var(--dsw-alias-border-l2); padding: 16px 0; display: flex; flex-direction: column; gap: 8px; }
.sdda-group:last-child { border-bottom: 0; }
.sdda-groupTitle { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 500; line-height: 22px; }
.sdda-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; font-weight: 400; line-height: 18px; }
.sdda-row { display: flex; align-items: center; gap: 8px; }
.sdda-rowText { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding-right: 16px; }
.sdda-title { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 400; line-height: 22px; }
.sdda-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; font-weight: 400; line-height: 18px; }
.sdda-control { display: inline-flex; align-items: center; gap: 8px; }
.sdda-stepper { border-radius: var(--dsw-radius-md); background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2)); display: inline-flex; justify-content: center; align-items: center; min-width: 72px; height: 36px; position: relative; }
.sdda-value { text-align: center; font-variant-numeric: tabular-nums; min-width: 18px; color: var(--dsw-alias-label-primary); font-size: 14px; line-height: 22px; }
.sdda-unit { color: var(--dsw-alias-label-secondary); font-size: 14px; line-height: 22px; }
.sdda-arrows { display: flex; flex-direction: column; gap: 2px; position: absolute; right: 8px; }
.sdda-arrow { border-radius: var(--dsw-radius-xs); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 75%, transparent); width: 17px; height: 12px; color: var(--dsw-alias-label-primary); cursor: pointer; border: none; display: inline-flex; justify-content: center; align-items: center; padding: 0; }
.sdda-arrow:disabled { color: var(--dsw-alias-label-caption); cursor: default; }
.sdda-swatch { width: 34px; height: 34px; border-radius: var(--dsw-radius-sm); border: 1px solid var(--dsw-alias-border-l2); display: inline-flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; position: relative; }
.sdda-swatch input[type="color"] { position: absolute; inset: -6px; width: 46px; height: 46px; cursor: pointer; border: none; padding: 0; background: transparent; opacity: 0; }
.sdda-link { color: var(--dsw-alias-brand-primary, var(--dsw-alias-state-business-primary)); background: transparent; border: none; cursor: pointer; font-size: 12px; line-height: 18px; padding: 0; }
.sdda-link:disabled { color: var(--dsw-alias-label-caption); cursor: default; }
.sdda-footer { display: flex; justify-content: flex-start; margin-top: 8px; }
.sdda-iconButton { border-radius: var(--dsw-radius-sm); cursor: pointer; width: 28px; height: 28px; color: var(--dsw-alias-label-secondary); background: transparent; border: none; flex: none; display: inline-flex; justify-content: center; align-items: center; padding: 0; }
.sdda-iconButton:hover { background: var(--dsw-alias-interactive-bg-hover); }
.sdda-hoverDelete { display: flex; align-items: center; gap: 6px; width: 100%; box-sizing: border-box; margin-top: 4px; padding: 4px 6px; border: none; border-radius: var(--dsw-radius-sm); background: transparent; color: var(--dsw-alias-state-error-primary); cursor: pointer; font: inherit; font-size: 12px; line-height: 18px; text-align: left; }
.sdda-hoverDelete:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); }
.sdda-hoverDeleteIcon { display: inline-flex; align-items: center; flex: none; }
.sdda-hoverDeleteLabel { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    `; }
  },
});
