import 'package:json_annotation/json_annotation.dart';

part 'session_model.g.dart';

/// One signed-in device on My Account → Sessions.
///
/// Almost everything is nullable because the backend returns a field only when
/// it genuinely knows it: the device columns depend on the client having sent
/// metadata or on a parseable User-Agent, and the location on the client having
/// reported a place. An absent value must render as nothing rather than a
/// placeholder — a sessions list confidently showing the wrong device is worse
/// than one showing less.
@JsonSerializable()
class SessionModel {
  SessionModel({
    required this.id,
    required this.isCurrent,
    required this.signedInAt,
    required this.lastUsedAt,
    required this.expiresAt,
    this.deviceName,
    this.deviceKind,
    this.os,
    this.osVersion,
    this.clientName,
    this.clientVersion,
    this.ipAddress,
    this.timezone,
    this.locationCity,
    this.locationCountry,
    this.locationSource,
  });

  final String id;

  /// True for the session making the request — the backend matches it against
  /// the session id carried in the access token.
  @JsonKey(name: 'is_current', defaultValue: false)
  final bool isCurrent;

  @JsonKey(name: 'device_name')
  final String? deviceName;

  /// LAPTOP | DESKTOP | PHONE | TABLET | UNKNOWN.
  @JsonKey(name: 'device_kind')
  final String? deviceKind;

  final String? os;

  @JsonKey(name: 'os_version')
  final String? osVersion;

  @JsonKey(name: 'client_name')
  final String? clientName;

  @JsonKey(name: 'client_version')
  final String? clientVersion;

  @JsonKey(name: 'ip_address')
  final String? ipAddress;

  final String? timezone;

  @JsonKey(name: 'location_city')
  final String? locationCity;

  @JsonKey(name: 'location_country')
  final String? locationCountry;

  /// CLIENT means the device reported this place, which makes it spoofable —
  /// show it as reported, never as verified.
  @JsonKey(name: 'location_source')
  final String? locationSource;

  /// The true sign-in moment; stable for the life of the session.
  @JsonKey(name: 'signed_in_at')
  final String signedInAt;

  /// Advances on each token refresh, so its resolution is the access token
  /// lifetime rather than per-request.
  @JsonKey(name: 'last_used_at')
  final String lastUsedAt;

  @JsonKey(name: 'expires_at')
  final String expiresAt;

  /// "MacBook Pro · Chrome", falling back to whichever half is known.
  String get displayName {
    final parts = [
      deviceName,
      clientName,
    ].where((p) => p != null && p.isNotEmpty).toList();
    return parts.isEmpty ? 'Unknown device' : parts.join(' · ');
  }

  /// "macOS 15.3 · Accra, Ghana" — segments omitted when absent.
  String get displayContext {
    final osLabel = [
      os,
      osVersion,
    ].where((p) => p != null && p.isNotEmpty).join(' ');
    final place = [
      locationCity,
      locationCountry,
    ].where((p) => p != null && p.isNotEmpty).join(', ');
    return [osLabel, place].where((p) => p.isNotEmpty).join(' · ');
  }

  /// "Signed in 3 days ago", or '' when the timestamp will not parse.
  ///
  /// Deliberately built from [signedInAt] rather than [lastUsedAt]: the latter
  /// advances on every token refresh, so it reads as "just now" for any live
  /// session and tells the reader nothing. When the session began is the fact
  /// worth showing.
  String get signedInLabel {
    final at = DateTime.tryParse(signedInAt);
    if (at == null) return '';
    return 'Signed in ${_ago(DateTime.now().toUtc().difference(at.toUtc()))}';
  }

  bool get isClientReportedLocation =>
      locationSource == 'CLIENT' &&
      locationCity != null &&
      locationCity!.isNotEmpty;

  factory SessionModel.fromJson(Map<String, dynamic> json) =>
      _$SessionModelFromJson(json);

  Map<String, dynamic> toJson() => _$SessionModelToJson(this);
}

/// Coarse relative time — "just now", "4 hours ago", "3 days ago".
///
/// A sessions list is read at a glance, so the unit carries the meaning and the
/// exact minute never does. Anything in the future (a device with a skewed
/// clock, say) collapses to "just now" rather than rendering a negative age.
String _ago(Duration d) {
  if (d.isNegative || d.inMinutes < 1) return 'just now';
  if (d.inMinutes < 60) return _plural(d.inMinutes, 'minute');
  if (d.inHours < 24) return _plural(d.inHours, 'hour');
  if (d.inDays < 7) return _plural(d.inDays, 'day');
  if (d.inDays < 30) return _plural(d.inDays ~/ 7, 'week');
  if (d.inDays < 365) return _plural(d.inDays ~/ 30, 'month');
  return _plural(d.inDays ~/ 365, 'year');
}

String _plural(int n, String unit) => '$n $unit${n == 1 ? '' : 's'} ago';
