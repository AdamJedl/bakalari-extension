with (import (fetchTarball https://github.com/nixos/nixpkgs/archive/nixos-23.11.tar.gz) {});
mkShell {
    buildInputs = [
        nodejs_21
        python312
    ];
}
