<?php

namespace App\Services;

/**
 * Agora AccessToken v006 builder (no external package required).
 *
 * Algorithm matches the official Agora PHP sample:
 * https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraDynamicKey/php
 */
class AgoraToken
{
    // Privilege keys used in the token
    private const PRIV_JOIN_CHANNEL         = 1;
    private const PRIV_PUBLISH_AUDIO_STREAM = 2;
    private const PRIV_PUBLISH_VIDEO_STREAM = 3;
    private const PRIV_PUBLISH_DATA_STREAM  = 4;

    /**
     * Build an RTC token for a publisher (can join + publish audio/video).
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
        $salt      = random_int(1, 99_999_999);
        $expireTs  = time() + $expiresIn;
        $uidStr    = $uid === 0 ? '' : (string) $uid;

        $privileges = [
            self::PRIV_JOIN_CHANNEL         => $expireTs,
            self::PRIV_PUBLISH_AUDIO_STREAM => $expireTs,
            self::PRIV_PUBLISH_VIDEO_STREAM => $expireTs,
            self::PRIV_PUBLISH_DATA_STREAM  => $expireTs,
        ];

        $rawMsg    = self::packMessage($salt, $expireTs, $privileges);
        $sigInput  = $appId . $channelName . $uidStr . $rawMsg;
        $signature = hash_hmac('sha256', $sigInput, $appCertificate, true);

        $crcChannel = self::unsignedCrc32($channelName);
        $crcUid     = self::unsignedCrc32($uidStr);

        $content    = self::packContent($signature, $crcChannel, $crcUid, $rawMsg);
        $compressed = zlib_encode($content, ZLIB_ENCODING_DEFLATE, 9);

        return '006' . $appId . base64_encode($compressed);
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

    private static function packMessage(int $salt, int $ts, array $privileges): string
    {
        return self::packUint32($salt)
             . self::packUint32($ts)
             . self::packMapUint32($privileges);
    }

    private static function packContent(string $sig, int $crcChannel, int $crcUid, string $rawMsg): string
    {
        return self::packString($sig)
             . self::packUint32($crcChannel)
             . self::packUint32($crcUid)
             . self::packString($rawMsg);
    }

    private static function unsignedCrc32(string $s): int
    {
        // crc32() in PHP returns a signed 32-bit int; mask to unsigned
        return crc32($s) & 0xFFFFFFFF;
    }
}
