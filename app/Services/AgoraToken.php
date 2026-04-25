<?php

namespace App\Services;

/**
 * Agora AccessToken2 (v007) builder.
 *
 * Matches the official Agora PHP sample:
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

    /**
     * Build an RTC token for a publisher (join + publish audio/video/data).
     *
     * @param  string  $appId          Agora App ID
     * @param  string  $appCertificate Agora App Certificate
     * @param  string  $channelName    Channel name
     * @param  int     $uid            User ID (0 = wildcard)
     * @param  int     $expiresIn      Seconds from now the token stays valid
     */
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

        // Agora AccessToken2 signing key: daily-rotating double HMAC
        $signingTs  = $issueTs - ($issueTs % 86400) + 86400;
        $signingKey = hash_hmac('sha256', (string) $issueTs,  $appCertificate, true);
        $signingKey = hash_hmac('sha256', (string) $signingTs, $signingKey,     true);

        // Pack the RTC service block
        $privileges = [
            self::PRIV_JOIN_CHANNEL  => $expire,
            self::PRIV_PUBLISH_AUDIO => $expire,
            self::PRIV_PUBLISH_VIDEO => $expire,
            self::PRIV_PUBLISH_DATA  => $expire,
        ];

        $service = self::packUint16(self::SERVICE_RTC)
                 . self::packString($channelName)
                 . self::packString($uidStr)
                 . self::packMapUint32($privileges);

        // Full message body that gets signed
        $msg = self::packUint32($expire)
             . self::packUint32($issueTs)
             . self::packUint32($salt)
             . self::packUint16(1)   // number of services
             . $service;

        $signature = hash_hmac('sha256', $msg, $signingKey, true);

        $content    = self::packString($signature) . $msg;
        $compressed = zlib_encode($content, ZLIB_ENCODING_DEFLATE, 9);

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
