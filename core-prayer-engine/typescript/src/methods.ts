import { CalculationMethod as AdhanCalculationMethod, CalculationParameters } from "adhan";
import { CalculationMethod } from "./types";

/**
 * Maps our CalculationMethod enum to adhan-js CalculationParameters factories.
 */
export function getCalculationParameters(
  method: CalculationMethod,
): CalculationParameters {
  switch (method) {
    case CalculationMethod.ISNA:
      return AdhanCalculationMethod.NorthAmerica();
    case CalculationMethod.MWL:
      return AdhanCalculationMethod.MuslimWorldLeague();
    case CalculationMethod.Egyptian:
      return AdhanCalculationMethod.Egyptian();
    case CalculationMethod.UmmAlQura:
      return AdhanCalculationMethod.UmmAlQura();
    case CalculationMethod.Karachi:
      return AdhanCalculationMethod.Karachi();
    case CalculationMethod.Tehran:
      return AdhanCalculationMethod.Tehran();
    default: {
      const _exhaustive: never = method;
      throw new Error(`Unknown calculation method: ${_exhaustive}`);
    }
  }
}
