// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Arbeidshistorikk-kontrakt
/// @notice Lagrer arbeidshistorikk på blockchain. Merk: Verifikasjon skjer utenfor kontrakten.

contract WorkHistoryContract {
    struct WorkEntry {
        string jobTitle;
        string company;
        string workYears;
        string roleDescription;
    }

    mapping(address => WorkEntry[]) private workHistories;

    event WorkHistoryAdded(
        address indexed user,
        string jobTitle,
        string company,
        string workYears,
        string roleDescription
    );

    /// @notice Legger til arbeidshistorikk på blockchain
    function addWorkHistory(
        string memory _jobTitle,
        string memory _company,
        string memory _workYears,
        string memory _roleDescription
    ) public {
        workHistories[msg.sender].push(
            WorkEntry(_jobTitle, _company, _workYears, _roleDescription)
        );

        emit WorkHistoryAdded(
            msg.sender,
            _jobTitle,
            _company,
            _workYears,
            _roleDescription
        );
    }
}

/* Strukturen WorkEntry lagrer informasjon som stillingstittel, firma, årstall og beskrivelse.
Data knyttes til brukeres adresser via en mapping, der hver bruker kun kan legge til sin egen arbeidshistorikk.
Eventet WorkHistoryAdded brukes for å gjøre alle innlagte data sporbare og transparente.
Det finnes ingen eksplisitt tilgangskontroll utover at brukere kun skriver til egne data.
Verifikasjon av opplysningene forutsettes gjort utenfor kontrakten, mens blockchain sørger for uforanderlighet etter innlegging. */