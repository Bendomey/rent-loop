enum ApiStatus {
  idle,
  pending,
  success,
  failed;

  bool isLoading() => this == pending;
  bool isSuccess() => this == success;
  bool isFailed() => this == failed;
}

class ApiState {
  ApiStatus status;
  String? errorMessage;

  ApiState({this.status = ApiStatus.idle, this.errorMessage});
}
