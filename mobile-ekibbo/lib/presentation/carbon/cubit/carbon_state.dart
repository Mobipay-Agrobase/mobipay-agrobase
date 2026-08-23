part of 'carbon_cubit.dart';

@freezed
class CarbonState with _$CarbonState {
  const factory CarbonState.initial() = _Initial;
  const factory CarbonState.generalChanged() = GeneralChangedState;
  const factory CarbonState.loading() = _Loading;
  const factory CarbonState.validateFarmland(String error) =
      CarbonValidateFarmlandState;
  const factory CarbonState.validateCrop(String error) =
      CarbonValidateCropState;
}
