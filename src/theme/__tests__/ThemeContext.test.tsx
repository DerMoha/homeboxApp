import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {ThemeProvider, useTheme} from '../ThemeContext';
import {storageService, STORAGE_KEYS} from '../../services/storageService';

jest.mock('../../services/storageService');

const mockedStorageService = storageService as jest.Mocked<
  typeof storageService
>;

const TestComponent: React.FC = () => {
  const {theme, isDarkMode, themeMode, setThemeMode, toggleTheme} = useTheme();
  return (
    <>
      <div data-testid="theme-mode">{themeMode}</div>
      <div data-testid="is-dark">{isDarkMode.toString()}</div>
      <div data-testid="primary-color">{theme.colors.primary}</div>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid="set-dark-btn" onClick={() => setThemeMode('dark')}>
        Set Dark
      </button>
    </>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorageService.getItem.mockResolvedValue(null);
    mockedStorageService.setItem.mockResolvedValue(true);
  });

  describe('ThemeProvider initialization', () => {
    it('should render without crashing', async () => {
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });
    });

    it('should load saved theme mode on mount', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce('dark');

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      expect(mockedStorageService.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.THEME_MODE,
      );
    });

    it('should load saved custom colors on mount', async () => {
      const customColors = {primary: '#FF0000'};
      mockedStorageService.getItem
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(customColors);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      expect(mockedStorageService.getItem).toHaveBeenCalledWith(
        STORAGE_KEYS.CUSTOM_COLORS,
      );
    });

    it('should handle errors when loading theme preferences', async () => {
      mockedStorageService.getItem.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      expect(mockedStorageService.getItem).toHaveBeenCalled();
    });

    it('should default to auto mode when no saved theme', async () => {
      mockedStorageService.getItem.mockResolvedValue(null);

      let testRenderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const themeModeElement = testRenderer!.root.findByProps({
        'data-testid': 'theme-mode',
      });
      expect(themeModeElement.props.children).toBe('auto');
    });
  });

  describe('setThemeMode()', () => {
    it('should save theme mode to storage', async () => {
      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const setDarkBtn = testRenderer!.root.findByProps({
        'data-testid': 'set-dark-btn',
      });

      await ReactTestRenderer.act(async () => {
        setDarkBtn.props.onClick();
      });

      expect(mockedStorageService.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.THEME_MODE,
        'dark',
      );
    });

    it('should handle storage errors when saving theme', async () => {
      mockedStorageService.setItem.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const setDarkBtn = testRenderer!.root.findByProps({
        'data-testid': 'set-dark-btn',
      });

      await ReactTestRenderer.act(async () => {
        setDarkBtn.props.onClick();
      });

      expect(mockedStorageService.setItem).toHaveBeenCalled();
    });
  });

  describe('toggleTheme()', () => {
    it('should toggle from light to dark', async () => {
      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      await ReactTestRenderer.act(async () => {
        testRenderer!.root
          .findByProps({'data-testid': 'set-dark-btn'})
          .props.onClick();
      });

      await ReactTestRenderer.act(async () => {
        testRenderer!.root
          .findByProps({'data-testid': 'toggle-btn'})
          .props.onClick();
      });

      const themeModeElement = testRenderer!.root.findByProps({
        'data-testid': 'theme-mode',
      });
      expect(themeModeElement.props.children).toBe('light');
    });
  });

  describe('isDarkMode', () => {
    it('should return true for dark mode', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce('dark');

      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const isDarkElement = testRenderer!.root.findByProps({
        'data-testid': 'is-dark',
      });
      expect(isDarkElement.props.children).toBe('true');
    });

    it('should return true for oled mode', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce('oled');

      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const isDarkElement = testRenderer!.root.findByProps({
        'data-testid': 'is-dark',
      });
      expect(isDarkElement.props.children).toBe('true');
    });

    it('should return false for light mode', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce('light');

      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const isDarkElement = testRenderer!.root.findByProps({
        'data-testid': 'is-dark',
      });
      expect(isDarkElement.props.children).toBe('false');
    });
  });

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      const ComponentWithoutProvider = () => {
        try {
          useTheme();
          return <div>Should not render</div>;
        } catch (error) {
          return <div>{(error as Error).message}</div>;
        }
      };

      let testRenderer: ReactTestRenderer.ReactTestRenderer;
      ReactTestRenderer.act(() => {
        testRenderer = ReactTestRenderer.create(<ComponentWithoutProvider />);
      });

      const errorMessage = testRenderer!.root.findByType('div');
      expect(errorMessage.props.children).toBe(
        'useTheme must be used within a ThemeProvider',
      );
    });
  });

  describe('Theme selection', () => {
    it('should apply light theme', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce('light');

      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const primaryColor = testRenderer!.root.findByProps({
        'data-testid': 'primary-color',
      });
      expect(primaryColor.props.children).toBeDefined();
    });

    it('should apply dark theme', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce('dark');

      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const primaryColor = testRenderer!.root.findByProps({
        'data-testid': 'primary-color',
      });
      expect(primaryColor.props.children).toBeDefined();
    });

    it('should apply oled theme', async () => {
      mockedStorageService.getItem.mockResolvedValueOnce('oled');

      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const primaryColor = testRenderer!.root.findByProps({
        'data-testid': 'primary-color',
      });
      expect(primaryColor.props.children).toBeDefined();
    });
  });

  describe('Custom colors', () => {
    it('should merge custom colors with theme', async () => {
      const customColors = {primary: '#FF0000'};
      mockedStorageService.getItem
        .mockResolvedValueOnce('light')
        .mockResolvedValueOnce(customColors);

      let testRenderer: ReactTestRenderer.ReactTestRenderer;

      await ReactTestRenderer.act(async () => {
        testRenderer = ReactTestRenderer.create(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>,
        );
      });

      const primaryColor = testRenderer!.root.findByProps({
        'data-testid': 'primary-color',
      });
      expect(primaryColor.props.children).toBe('#FF0000');
    });
  });
});
