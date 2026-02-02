/**
 * AGUI COMPONENTS INDEX
 * Centralized exports for all AGUI (AI-Generated User Interface) components
 * Used by Renata for dynamic UI generation
 */

// Calendar Components
export {
  AguiCalendarComponent,
  AguiDatePickerComponent,
  AguiTradingCalendarComponent
} from './calendar-components'

// Component Type Guards
import { AguiComponent } from '@/types/agui'

export function isCalendarComponent(component: AguiComponent): component is import('@/types/agui').AguiCalendar {
  return component.type === 'calendar'
}

export function isDatePickerComponent(component: AguiComponent): component is import('@/types/agui').AguiDatePicker {
  return component.type === 'date-picker'
}

export function isTradingCalendarComponent(component: AguiComponent): component is import('@/types/agui').AguiTradingCalendar {
  return component.type === 'trading-calendar'
}

// Main AGUI Renderer for Calendar Components
export function renderAguiCalendarComponent(component: AguiComponent, props: any) {
  switch (component.type) {
    case 'calendar':
      return AguiCalendarComponent({ component, ...props })
    case 'date-picker':
      return AguiDatePickerComponent({ component, ...props })
    case 'trading-calendar':
      return AguiTradingCalendarComponent({ component, ...props })
    default:
      return null
  }
}