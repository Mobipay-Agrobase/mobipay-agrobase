part of AppProvider;

class AppListingFarmer {
  bool isFetching = false;
  bool isInit = false;
  int currentPage = 1;
  int totalPage = 1;
  String searchParam = '';

  final List<FarmerModel> farmers = [];

  searchFarmer(String param) async {
    currentPage = 1;
    totalPage = 1;
    searchParam = param;
    farmers.clear();
    await fetchNextPage();
  }

  fetchInit() async {
    if (isInit) return;
    await fetchNextPage();
    isInit = true;
  }

  fetchNextPage() async {
    if (isFetching) return;
    if (currentPage > totalPage) return;
    try {
      isFetching = true;
      DialogHelper.showLoading();
      final res = await ApiProvider.instance.apiFarmer
          .getAllFarmers(currentPage, searchParam);
      isFetching = false;
      DialogHelper.hideLoading();
      if (res == null) {
        throw const FormatException('response null');
      }
      if (res.data == null) {
        throw const FormatException('data null');
      }
      if (res.data!.farmerData == null) {
        throw const FormatException('farmerData null');
      }
      final farmerData = res.data!.farmerData!;
      totalPage = farmerData.lastPage ?? totalPage;
      currentPage++;
      farmers.addAll(farmerData.data ?? []);
    } catch (e) {
      isFetching = false;
      DialogHelper.hideLoading();
      debugPrint("AppListingFarmer fetchNextPage error: $e");
    }
  }
}
