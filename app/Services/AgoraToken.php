<?php

namespace App\Services;

/**
 * Agora AccessToken2 (v007) builder.
 * Matches the official Agora PHP SDK exactly:
 * https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraDynamicKey/php
 */
class AgoraToken
{
    private const VERSION = '007';

    private const SERVICE_RTC = 1;

    private const PRIV_JOIN_CHANNEL    = 1;
    private const PRIV_PUBLISH_AUDIO   = 2;
    private const PRIV_PUBLISH_VIDEO   = 3;
    private const PRIV_PUBLISH_DATA    = 4;

    public static function buildRtcToken(
        string $appId,
        string $appCertificate,
        string $channelName,
        int    $uid,
        int    $expiresIn = 3600
    ): string {
        $issueTs = time();
        $salt    = random_int(1, 99_999_999);
        $expire  = $issueTs + $expiresIn;
        $uidStr  = $uid === 0 ? '' : (string) $uid;

        // Signing key: HMAC(key=pack(issueTs), msg=appCert) -> HMAC(key=pack(salt), msg=result)
        $signingKey = hash_hmac('sha256', $appCertificate, self::packUint32($issueTs), true);
        $signingKey = hash_hmac('sha256', $signingKey,     self::packUint32($salt),    true);

        // Service block: type + privileges map + channelName + uid (official order)
        $privileges = [
            self::PRIV_JOIN_CHANNEL    => $expire,
            self::PRIV_PUBLISH_AUDIO   => $expire,
            self::PRIV_PUBLISH_VIDEO   => $expire,
            self::PRIV_PUBLISH_DATA    => $expire,
        ];

        $service = self::packUint16(self::SERVICE_RTC)
                 . self::packMapUint32($privileges)
                 . self::packString($channelName)
                 . self::packString($uidStr);

        // Data body: appId + issueTs + expire + salt + numServices + service
        $data = self::packString($appId)
              . self::packUint32($issueTs)
              . self::packUint32($expire)
              . self::packUint32($salt)
              . self::packUint16(1)
              . $service;

        $signature = hash_hmac('sha256', $data, $signingKey, true);

        $compressed = zlib_encode(self::packString($signature) . $data, ZLIB_ENCODING_DEFLATE, 9);

        return self::VERSION . base64_encode($compressed);
    }

    // ── Packing helpers ──────────────────────────────────────────────────────

    private static function packUint16(int $v): string
    {
        return pack('v', $v);
    }

    private static function packUint32(int $v): string
    {
        return pack('V', $v);
    }

    private static function packString(string $v): string
    {
        return self::packUint16(strlen($v)) . $v;
    }

    private static function packMapUint32(array $map): string
    {
        ksort($map);
        $out = self::packUint16(count($map));
        foreach ($map as $key => $value) {
            $out .= self::packUint16($key);
            $out .= self::packUint32($value);
        }
        return $out;
    }
}
